import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import {
  SharedDataContext,
  SharingRelationship,
  SharingRelationshipDetails,
  SharingRelationshipStatus,
} from '@/lib/types/sharing.types';
import { Query } from 'node-appwrite';

import { auditLogService } from './audit-log.service';
import { UserService } from './user.service';

/**
 * Sharing Service
 * Manages sharing relationships and provides shared data context
 * for the joint accounts sharing system
 */

export class SharingService {
  private dbAdapter: any;
  private userService: UserService;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
    this.userService = new UserService();
  }

  // ============================================
  // Relationship Queries
  // ============================================

  /**
   * Get active sharing relationship for a user
   * Returns relationship details if user is either responsible or member
   *
   * @param userId - ID of the user
   * @returns Active relationship or null if none exists
   */
  async getActiveRelationship(userId: string): Promise<SharingRelationship | null> {
    try {
      // Check if user is a member in an active relationship
      const memberResponse = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_RELATIONSHIPS, [
        Query.equal('member_user_id', userId),
        Query.equal('status', 'active'),
        Query.limit(1),
      ]);

      if (memberResponse.documents && memberResponse.documents.length > 0) {
        return memberResponse.documents[0] as unknown as SharingRelationship;
      }

      // Check if user is responsible in an active relationship
      const responsibleResponse = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_RELATIONSHIPS, [
        Query.equal('responsible_user_id', userId),
        Query.equal('status', 'active'),
        Query.limit(1),
      ]);

      if (responsibleResponse.documents && responsibleResponse.documents.length > 0) {
        return responsibleResponse.documents[0] as unknown as SharingRelationship;
      }

      return null;
    } catch (error) {
      console.error('Error fetching active relationship:', error);
      return null;
    }
  }

  /**
   * Get all active members for a responsible user
   *
   * @param responsibleUserId - ID of the responsible user
   * @returns Array of relationship details with member information
   */
  async getActiveMembers(responsibleUserId: string): Promise<SharingRelationshipDetails[]> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_RELATIONSHIPS, [
        Query.equal('responsible_user_id', responsibleUserId),
        Query.equal('status', 'active'),
        Query.orderDesc('started_at'),
      ]);

      const relationships = (response.documents || []) as unknown as SharingRelationship[];

      // Fetch user details for each relationship
      const relationshipDetails = await Promise.all(
        relationships.map(async (relationship) => {
          return this.getRelationshipDetails(relationship.$id);
        }),
      );

      return relationshipDetails;
    } catch (error) {
      console.error('Error fetching active members:', error);
      return [];
    }
  }

  /**
   * Check if a user has an active relationship
   *
   * @param userId - ID of the user
   * @returns True if user has active relationship
   */
  async hasActiveRelationship(userId: string): Promise<boolean> {
    const relationship = await this.getActiveRelationship(userId);
    return relationship !== null;
  }

  /**
   * Get shared data context for a user
   * Returns information about linked user and relationship type
   *
   * @param userId - ID of the user
   * @returns Shared data context
   */
  async getSharedDataContext(userId: string): Promise<SharedDataContext> {
    const relationship = await this.getActiveRelationship(userId);

    if (!relationship) {
      return {
        currentUserId: userId,
        linkedUserId: undefined,
        isResponsible: false,
        isMember: false,
        hasActiveRelationship: false,
      };
    }

    const isResponsible = relationship.responsible_user_id === userId;
    const isMember = relationship.member_user_id === userId;
    const linkedUserId = isResponsible ? relationship.member_user_id : relationship.responsible_user_id;

    return {
      currentUserId: userId,
      linkedUserId,
      isResponsible,
      isMember,
      hasActiveRelationship: true,
    };
  }

  /**
   * Get relationship details by ID
   * Includes complete user information for both responsible and member users
   *
   * @param relationshipId - ID of the relationship
   * @returns Relationship details with user information
   * @throws Error if relationship not found
   */
  async getRelationshipDetails(relationshipId: string): Promise<SharingRelationshipDetails> {
    try {
      // Fetch relationship
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.SHARING_RELATIONSHIPS, relationshipId);
      const relationship = document as unknown as SharingRelationship;

      // Fetch user details
      const [responsibleUser, memberUser] = await Promise.all([
        this.userService.findUserById(relationship.responsible_user_id),
        this.userService.findUserById(relationship.member_user_id),
      ]);

      if (!responsibleUser) {
        throw new Error('Responsible user not found');
      }

      if (!memberUser) {
        throw new Error('Member user not found');
      }

      return {
        relationship,
        responsibleUser: {
          id: responsibleUser.$id,
          name: responsibleUser.name,
          email: responsibleUser.email,
        },
        memberUser: {
          id: memberUser.$id,
          name: memberUser.name,
          email: memberUser.email,
        },
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error('Relacionamento não encontrado');
      }
      throw error;
    }
  }

  // ============================================
  // Relationship Management
  // ============================================

  /**
   * Terminate a sharing relationship
   * Can be called by either responsible or member user
   * Immediately revokes data access for both users
   *
   * @param relationshipId - ID of the relationship to terminate
   * @param terminatedBy - ID of the user terminating the relationship
   * @throws Error if validation fails
   */
  async terminateRelationship(relationshipId: string, terminatedBy: string): Promise<void> {
    try {
      // Fetch relationship
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.SHARING_RELATIONSHIPS, relationshipId);
      const relationship = document as unknown as SharingRelationship;

      // Validate relationship status
      if (relationship.status !== 'active') {
        throw new Error('Este relacionamento já foi encerrado');
      }

      // Validate user is part of the relationship
      const isResponsible = relationship.responsible_user_id === terminatedBy;
      const isMember = relationship.member_user_id === terminatedBy;

      if (!isResponsible && !isMember) {
        throw new Error('Você não tem permissão para encerrar este relacionamento');
      }

      // Update relationship status
      const now = new Date().toISOString();
      await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.SHARING_RELATIONSHIPS, relationshipId, {
        status: 'terminated' as SharingRelationshipStatus,
        terminated_at: now,
        terminated_by: terminatedBy,
        updated_at: now,
      });

      // Log relationship termination
      try {
        await auditLogService.logRelationshipTerminated(
          terminatedBy,
          relationshipId,
          relationship.responsible_user_id,
          relationship.member_user_id,
        );
      } catch (auditError) {
        console.error('Failed to log relationship termination:', auditError);
        // Don't fail the termination if audit logging fails
      }

      // Send notifications to both users
      try {
        await this.sendTerminationNotifications(relationship, terminatedBy);
      } catch (emailError) {
        console.error('Failed to send termination notifications:', emailError);
        // Don't fail the termination if email fails
      }
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error('Relacionamento não encontrado');
      }
      throw error;
    }
  }

  // ============================================
  // Notification Methods
  // ============================================

  /**
   * Send email notifications when relationship is terminated
   * Notifies both responsible and member users
   *
   * @param relationship - The terminated relationship
   * @param terminatedBy - ID of the user who terminated the relationship
   */
  private async sendTerminationNotifications(relationship: SharingRelationship, terminatedBy: string): Promise<void> {
    try {
      // Fetch user details
      const [responsibleUser, memberUser, terminatingUser] = await Promise.all([
        this.userService.findUserById(relationship.responsible_user_id),
        this.userService.findUserById(relationship.member_user_id),
        this.userService.findUserById(terminatedBy),
      ]);

      if (!responsibleUser || !memberUser || !terminatingUser) {
        console.error('Failed to fetch user details for termination notifications');
        return;
      }

      const terminatedAt = new Date(relationship.terminated_at || new Date()).toLocaleString('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
      });

      // Determine who to notify (the other user)
      const otherUser = terminatedBy === responsibleUser.$id ? memberUser : responsibleUser;

      const emailTemplate = this.getTerminationEmailTemplate(terminatingUser.name, otherUser.name, terminatedAt);

      // Log email for development
      console.log('='.repeat(80));
      console.log('RELATIONSHIP TERMINATION EMAIL');
      console.log('='.repeat(80));
      console.log(`To: ${otherUser.email}`);
      console.log(`From: System`);
      console.log(`Subject: ${emailTemplate.subject}`);
      console.log('');
      console.log(emailTemplate.text);
      console.log('');
      console.log('='.repeat(80));

      // TODO: Implement actual email sending using Appwrite Messaging or external email service
      // Example using Appwrite Messaging (when available):
      // const messaging = getAppwriteMessaging();
      // await messaging.createEmail({
      //   to: otherUser.email,
      //   subject: emailTemplate.subject,
      //   content: emailTemplate.html,
      // });

      // Example using Nodemailer or Resend:
      // await emailService.send({
      //   to: otherUser.email,
      //   subject: emailTemplate.subject,
      //   text: emailTemplate.text,
      //   html: emailTemplate.html,
      // });
    } catch (error) {
      console.error('Error sending termination notifications:', error);
      throw error;
    }
  }

  /**
   * Get termination email template
   *
   * @param terminatingUserName - Name of the user who terminated the relationship
   * @param recipientName - Name of the user receiving the notification
   * @param terminatedAt - Formatted termination timestamp
   * @returns Email template with subject, text, and HTML versions
   */
  private getTerminationEmailTemplate(
    terminatingUserName: string,
    recipientName: string,
    terminatedAt: string,
  ): { subject: string; text: string; html: string } {
    const subject = 'Conta Conjunta Encerrada';

    const text = `
Olá ${recipientName},

Informamos que ${terminatingUserName} encerrou o compartilhamento de conta conjunta.

Detalhes do encerramento:
• Data e hora: ${terminatedAt}
• Encerrado por: ${terminatingUserName}

A partir de agora:
• Você não terá mais acesso aos dados financeiros de ${terminatingUserName}
• ${terminatingUserName} não terá mais acesso aos seus dados financeiros
• Todos os seus dados pessoais permanecem intactos e seguros
• Você pode criar uma nova conta conjunta com outro usuário, se desejar

Se você tiver alguma dúvida ou precisar de assistência, entre em contato com nosso suporte.

Atenciosamente,
Equipe Horizon AI
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #dc2626;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .details {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .details h2 {
      color: #991b1b;
      font-size: 16px;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .details ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .details li {
      margin: 8px 0;
      color: #7f1d1d;
    }
    .info-box {
      background-color: #f3f4f6;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-box h3 {
      color: #1f2937;
      font-size: 16px;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .info-box ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .info-box li {
      margin: 8px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Conta Conjunta Encerrada</h1>

    <p class="greeting">Olá ${recipientName},</p>

    <p>Informamos que <strong>${terminatingUserName}</strong> encerrou o compartilhamento de conta conjunta.</p>

    <div class="details">
      <h2>Detalhes do Encerramento</h2>
      <ul>
        <li><strong>Data e hora:</strong> ${terminatedAt}</li>
        <li><strong>Encerrado por:</strong> ${terminatingUserName}</li>
      </ul>
    </div>

    <div class="info-box">
      <h3>A partir de agora:</h3>
      <ul>
        <li>Você não terá mais acesso aos dados financeiros de ${terminatingUserName}</li>
        <li>${terminatingUserName} não terá mais acesso aos seus dados financeiros</li>
        <li>Todos os seus dados pessoais permanecem intactos e seguros</li>
        <li>Você pode criar uma nova conta conjunta com outro usuário, se desejar</li>
      </ul>
    </div>

    <div class="footer">
      <p>Se você tiver alguma dúvida ou precisar de assistência, entre em contato com nosso suporte.</p>
      <p>Atenciosamente,<br>Equipe Horizon AI</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }
}
