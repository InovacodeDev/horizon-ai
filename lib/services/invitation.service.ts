import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID } from '@/lib/appwrite/schema';
import {
  InvitationStatus,
  SharingInvitation,
  SharingRelationship,
  SharingRelationshipStatus,
} from '@/lib/types/sharing.types';
import crypto from 'crypto';
import { ID, Query } from 'node-appwrite';

import { auditLogService } from './audit-log.service';
import { UserService } from './user.service';

/**
 * Invitation Service
 * Handles invitation creation, validation, acceptance, and lifecycle management
 * for the joint accounts sharing system
 */

export class InvitationService {
  private dbAdapter: any;
  private userService: UserService;

  // Invitation expiration time in days
  private readonly INVITATION_EXPIRATION_DAYS = 7;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
    this.userService = new UserService();
  }

  // ============================================
  // Invitation Creation
  // ============================================

  /**
   * Create a new invitation
   * Validates that invited user doesn't already have an active relationship
   *
   * @param responsibleUserId - ID of the user creating the invitation
   * @param invitedEmail - Email of the user being invited
   * @returns Created invitation
   * @throws Error if validation fails
   */
  async createInvitation(responsibleUserId: string, invitedEmail: string): Promise<SharingInvitation> {
    // Validate responsible user exists
    const responsibleUser = await this.userService.findUserById(responsibleUserId);
    if (!responsibleUser) {
      throw new Error('Responsible user not found');
    }

    // Validate invited email
    if (!invitedEmail || !this.isValidEmail(invitedEmail)) {
      throw new Error('Invalid email address');
    }

    // Prevent self-invitation
    if (responsibleUser.email.toLowerCase() === invitedEmail.toLowerCase()) {
      throw new Error('Você não pode convidar a si mesmo');
    }

    // Check if invited user exists
    const invitedUser = await this.userService.findUserByEmail(invitedEmail);
    if (!invitedUser) {
      throw new Error('Usuário não encontrado com este email');
    }

    // Check if invited user already has an active relationship
    const hasActiveRelationship = await this.checkActiveRelationship(invitedUser.$id);
    if (hasActiveRelationship) {
      throw new Error('Este usuário já possui uma conta conjunta ativa');
    }

    // Check if there's already a pending invitation for this email from this responsible user
    const existingPendingInvitation = await this.getPendingInvitationByEmailAndResponsible(
      invitedEmail,
      responsibleUserId,
    );
    if (existingPendingInvitation) {
      throw new Error('Já existe um convite pendente para este usuário');
    }

    // Generate secure token
    const token = this.generateInvitationToken();

    // Calculate expiration date
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

    // Create invitation
    const invitationData = {
      responsible_user_id: responsibleUserId,
      invited_email: invitedEmail,
      invited_user_id: invitedUser.$id,
      token,
      status: 'pending' as InvitationStatus,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const document = await this.dbAdapter.createDocument(
      DATABASE_ID,
      COLLECTIONS.SHARING_INVITATIONS,
      ID.unique(),
      invitationData,
    );

    const invitation = document as unknown as SharingInvitation;

    // Log invitation creation
    try {
      await auditLogService.logInvitationCreated(responsibleUserId, invitation.$id, invitedEmail);
    } catch (auditError) {
      console.error('Failed to log invitation creation:', auditError);
      // Don't fail the invitation creation if audit logging fails
    }

    // Send invitation email
    try {
      await this.sendInvitationEmail(invitation, responsibleUser.name);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the invitation creation if email fails
      // The invitation is still valid and can be accessed via the token
    }

    return invitation;
  }

  // ============================================
  // Invitation Retrieval
  // ============================================

  /**
   * Get invitation by token
   *
   * @param token - Invitation token
   * @returns Invitation or null if not found
   */
  async getInvitationByToken(token: string): Promise<SharingInvitation | null> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_INVITATIONS, [
        Query.equal('token', token),
        Query.limit(1),
      ]);

      if (!response.documents || response.documents.length === 0) {
        return null;
      }

      return response.documents[0] as unknown as SharingInvitation;
    } catch (error) {
      console.error('Error fetching invitation by token:', error);
      return null;
    }
  }

  /**
   * Get all invitations for a responsible user
   *
   * @param responsibleUserId - ID of the responsible user
   * @returns Array of invitations
   */
  async getInvitationsByResponsible(responsibleUserId: string): Promise<SharingInvitation[]> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_INVITATIONS, [
        Query.equal('responsible_user_id', responsibleUserId),
        Query.orderDesc('created_at'),
      ]);

      return (response.documents || []) as unknown as SharingInvitation[];
    } catch (error) {
      console.error('Error fetching invitations by responsible user:', error);
      return [];
    }
  }

  /**
   * Get pending invitations for an email
   *
   * @param email - Email address
   * @returns Array of pending invitations
   */
  async getPendingInvitationsByEmail(email: string): Promise<SharingInvitation[]> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_INVITATIONS, [
        Query.equal('invited_email', email),
        Query.equal('status', 'pending'),
        Query.orderDesc('created_at'),
      ]);

      return (response.documents || []) as unknown as SharingInvitation[];
    } catch (error) {
      console.error('Error fetching pending invitations by email:', error);
      return [];
    }
  }

  // ============================================
  // Invitation Actions
  // ============================================

  /**
   * Accept an invitation
   * Creates sharing relationship and updates invitation status
   *
   * @param token - Invitation token
   * @param memberUserId - ID of the user accepting the invitation
   * @returns Created sharing relationship
   * @throws Error if validation fails
   */
  async acceptInvitation(token: string, memberUserId: string): Promise<SharingRelationship> {
    // Get invitation
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error('Convite inválido');
    }

    // Validate invitation status
    if (invitation.status !== 'pending') {
      throw new Error('Este convite já foi processado');
    }

    // Validate expiration
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      // Mark as expired
      await this.updateInvitationStatus(invitation.$id, 'expired');
      throw new Error('Este convite expirou');
    }

    // Validate member user
    const memberUser = await this.userService.findUserById(memberUserId);
    if (!memberUser) {
      throw new Error('Usuário não encontrado');
    }

    // Validate email matches
    if (memberUser.email.toLowerCase() !== invitation.invited_email.toLowerCase()) {
      throw new Error('Este convite não foi enviado para você');
    }

    // Check if member already has an active relationship
    const hasActiveRelationship = await this.checkActiveRelationship(memberUserId);
    if (hasActiveRelationship) {
      throw new Error('Você já possui uma conta conjunta ativa');
    }

    // Create sharing relationship
    const relationshipNow = new Date();
    const relationshipData = {
      responsible_user_id: invitation.responsible_user_id,
      member_user_id: memberUserId,
      status: 'active' as SharingRelationshipStatus,
      started_at: relationshipNow.toISOString(),
      created_at: relationshipNow.toISOString(),
      updated_at: relationshipNow.toISOString(),
    };

    const relationshipDocument = await this.dbAdapter.createDocument(
      DATABASE_ID,
      COLLECTIONS.SHARING_RELATIONSHIPS,
      ID.unique(),
      relationshipData,
    );

    const relationship = relationshipDocument as unknown as SharingRelationship;

    // Update invitation status
    await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.SHARING_INVITATIONS, invitation.$id, {
      status: 'accepted',
      accepted_at: relationshipNow.toISOString(),
      updated_at: relationshipNow.toISOString(),
    });

    // Log invitation acceptance
    try {
      await auditLogService.logInvitationAccepted(
        memberUserId,
        invitation.$id,
        invitation.responsible_user_id,
        relationship.$id,
      );
    } catch (auditError) {
      console.error('Failed to log invitation acceptance:', auditError);
      // Don't fail the acceptance if audit logging fails
    }

    return relationship;
  }

  /**
   * Reject an invitation
   *
   * @param token - Invitation token
   * @param memberUserId - ID of the user rejecting the invitation
   * @throws Error if validation fails
   */
  async rejectInvitation(token: string, memberUserId: string): Promise<void> {
    // Get invitation
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error('Convite inválido');
    }

    // Validate invitation status
    if (invitation.status !== 'pending') {
      throw new Error('Este convite já foi processado');
    }

    // Validate member user
    const memberUser = await this.userService.findUserById(memberUserId);
    if (!memberUser) {
      throw new Error('Usuário não encontrado');
    }

    // Validate email matches
    if (memberUser.email.toLowerCase() !== invitation.invited_email.toLowerCase()) {
      throw new Error('Este convite não foi enviado para você');
    }

    // Update invitation status
    await this.updateInvitationStatus(invitation.$id, 'rejected');

    // Log invitation rejection
    try {
      await auditLogService.logInvitationRejected(memberUserId, invitation.$id, invitation.responsible_user_id);
    } catch (auditError) {
      console.error('Failed to log invitation rejection:', auditError);
      // Don't fail the rejection if audit logging fails
    }
  }

  /**
   * Cancel a pending invitation (by responsible user)
   *
   * @param invitationId - ID of the invitation
   * @param responsibleUserId - ID of the responsible user
   * @throws Error if validation fails
   */
  async cancelInvitation(invitationId: string, responsibleUserId: string): Promise<void> {
    // Get invitation
    const invitation = await this.getInvitationById(invitationId);
    if (!invitation) {
      throw new Error('Convite não encontrado');
    }

    // Validate responsible user
    if (invitation.responsible_user_id !== responsibleUserId) {
      throw new Error('Você não tem permissão para cancelar este convite');
    }

    // Validate invitation status
    if (invitation.status !== 'pending') {
      throw new Error('Apenas convites pendentes podem ser cancelados');
    }

    // Update invitation status
    await this.updateInvitationStatus(invitationId, 'cancelled');

    // Log invitation cancellation
    try {
      await auditLogService.logInvitationCancelled(responsibleUserId, invitationId, invitation.invited_email);
    } catch (auditError) {
      console.error('Failed to log invitation cancellation:', auditError);
      // Don't fail the cancellation if audit logging fails
    }
  }

  /**
   * Resend invitation email
   *
   * @param invitationId - ID of the invitation
   * @param responsibleUserId - ID of the responsible user
   * @throws Error if validation fails
   */
  async resendInvitation(invitationId: string, responsibleUserId: string): Promise<void> {
    // Get invitation
    const invitation = await this.getInvitationById(invitationId);
    if (!invitation) {
      throw new Error('Convite não encontrado');
    }

    // Validate responsible user
    if (invitation.responsible_user_id !== responsibleUserId) {
      throw new Error('Você não tem permissão para reenviar este convite');
    }

    // Validate invitation status
    if (invitation.status !== 'pending') {
      throw new Error('Apenas convites pendentes podem ser reenviados');
    }

    // Validate expiration
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      throw new Error('Este convite expirou. Crie um novo convite.');
    }

    // Get responsible user
    const responsibleUser = await this.userService.findUserById(responsibleUserId);
    if (!responsibleUser) {
      throw new Error('Usuário responsável não encontrado');
    }

    // Resend email
    await this.sendInvitationEmail(invitation, responsibleUser.name);
  }

  /**
   * Expire old invitations (cron job)
   * Marks all pending invitations that have passed their expiration date as expired
   *
   * @returns Number of invitations expired
   */
  async expireOldInvitations(): Promise<number> {
    try {
      const now = new Date().toISOString();

      // Get all pending invitations that have expired
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_INVITATIONS, [
        Query.equal('status', 'pending'),
        Query.lessThan('expires_at', now),
      ]);

      const expiredInvitations = (response.documents || []) as unknown as SharingInvitation[];

      // Update each invitation to expired status
      let count = 0;
      for (const invitation of expiredInvitations) {
        try {
          await this.updateInvitationStatus(invitation.$id, 'expired');
          count++;
        } catch (error) {
          console.error(`Failed to expire invitation ${invitation.$id}:`, error);
        }
      }

      console.log(`Expired ${count} old invitations`);
      return count;
    } catch (error) {
      console.error('Error expiring old invitations:', error);
      return 0;
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Generate secure invitation token
   * Uses crypto.randomBytes for cryptographically secure random token
   *
   * @returns Secure random token
   */
  private generateInvitationToken(): string {
    // Generate 32 bytes of random data and convert to hex string
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send invitation email
   *
   * @param invitation - Invitation to send
   * @param responsibleUserName - Name of the responsible user
   */
  private async sendInvitationEmail(invitation: SharingInvitation, responsibleUserName: string): Promise<void> {
    const invitationLink = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/family/invitations/${invitation.token}`;

    const emailTemplate = this.getInvitationEmailTemplate(
      responsibleUserName,
      invitationLink,
      this.INVITATION_EXPIRATION_DAYS,
    );

    // Log email for development
    console.log('='.repeat(80));
    console.log('INVITATION EMAIL');
    console.log('='.repeat(80));
    console.log(`To: ${invitation.invited_email}`);
    console.log(`From: ${responsibleUserName}`);
    console.log(`Subject: ${emailTemplate.subject}`);
    console.log('');
    console.log(emailTemplate.text);
    console.log('');
    console.log('='.repeat(80));

    // TODO: Implement actual email sending using Appwrite Messaging or external email service
    // Example using Appwrite Messaging (when available):
    // const messaging = getAppwriteMessaging();
    // await messaging.createEmail({
    //   to: invitation.invited_email,
    //   subject: emailTemplate.subject,
    //   content: emailTemplate.html,
    // });

    // Example using Nodemailer or Resend:
    // await emailService.send({
    //   to: invitation.invited_email,
    //   subject: emailTemplate.subject,
    //   text: emailTemplate.text,
    //   html: emailTemplate.html,
    // });
  }

  /**
   * Get invitation email template
   *
   * @param responsibleUserName - Name of the responsible user
   * @param invitationLink - Link to accept the invitation
   * @param expirationDays - Number of days until expiration
   * @returns Email template with subject, text, and HTML versions
   */
  private getInvitationEmailTemplate(
    responsibleUserName: string,
    invitationLink: string,
    expirationDays: number,
  ): { subject: string; text: string; html: string } {
    const subject = 'Convite para Conta Conjunta';

    const text = `
Olá!

${responsibleUserName} convidou você para compartilhar dados financeiros através de uma conta conjunta.

Com uma conta conjunta, vocês poderão:
• Visualizar contas e transações um do outro
• Acompanhar o orçamento familiar em conjunto
• Ter uma visão completa das finanças compartilhadas

Para aceitar o convite, clique no link abaixo:
${invitationLink}

Este convite expira em ${expirationDays} dias.

Se você não reconhece este convite, pode ignorar este email com segurança.

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
      color: #2563eb;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .invitation-from {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .benefits {
      background-color: #f3f4f6;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .benefits ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .benefits li {
      margin: 8px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .cta-button:hover {
      background-color: #1d4ed8;
    }
    .expiration {
      color: #6b7280;
      font-size: 14px;
      margin-top: 20px;
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
    <h1>Convite para Conta Conjunta</h1>

    <p class="invitation-from">
      ${responsibleUserName} convidou você para compartilhar dados financeiros.
    </p>

    <div class="benefits">
      <p><strong>Com uma conta conjunta, vocês poderão:</strong></p>
      <ul>
        <li>Visualizar contas e transações um do outro</li>
        <li>Acompanhar o orçamento familiar em conjunto</li>
        <li>Ter uma visão completa das finanças compartilhadas</li>
      </ul>
    </div>

    <p>Para aceitar o convite, clique no botão abaixo:</p>

    <a href="${invitationLink}" class="cta-button">Aceitar Convite</a>

    <p class="expiration">
      Este convite expira em ${expirationDays} dias.
    </p>

    <div class="footer">
      <p>Se você não reconhece este convite, pode ignorar este email com segurança.</p>
      <p>Atenciosamente,<br>Equipe Horizon AI</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }

  /**
   * Get invitation by ID
   *
   * @param invitationId - ID of the invitation
   * @returns Invitation or null if not found
   */
  private async getInvitationById(invitationId: string): Promise<SharingInvitation | null> {
    try {
      const document = await this.dbAdapter.getDocument(DATABASE_ID, COLLECTIONS.SHARING_INVITATIONS, invitationId);
      return document as unknown as SharingInvitation;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update invitation status
   *
   * @param invitationId - ID of the invitation
   * @param status - New status
   */
  private async updateInvitationStatus(invitationId: string, status: InvitationStatus): Promise<void> {
    await this.dbAdapter.updateDocument(DATABASE_ID, COLLECTIONS.SHARING_INVITATIONS, invitationId, {
      status,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Check if user has an active relationship
   *
   * @param userId - ID of the user
   * @returns True if user has active relationship
   */
  private async checkActiveRelationship(userId: string): Promise<boolean> {
    try {
      // Check if user is a member in an active relationship
      const memberResponse = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_RELATIONSHIPS, [
        Query.equal('member_user_id', userId),
        Query.equal('status', 'active'),
        Query.limit(1),
      ]);

      if (memberResponse.documents && memberResponse.documents.length > 0) {
        return true;
      }

      // Check if user is responsible in an active relationship
      const responsibleResponse = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_RELATIONSHIPS, [
        Query.equal('responsible_user_id', userId),
        Query.equal('status', 'active'),
        Query.limit(1),
      ]);

      return responsibleResponse.documents && responsibleResponse.documents.length > 0;
    } catch (error) {
      console.error('Error checking active relationship:', error);
      return false;
    }
  }

  /**
   * Get pending invitation by email and responsible user
   *
   * @param email - Email address
   * @param responsibleUserId - ID of the responsible user
   * @returns Invitation or null if not found
   */
  private async getPendingInvitationByEmailAndResponsible(
    email: string,
    responsibleUserId: string,
  ): Promise<SharingInvitation | null> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SHARING_INVITATIONS, [
        Query.equal('invited_email', email),
        Query.equal('responsible_user_id', responsibleUserId),
        Query.equal('status', 'pending'),
        Query.limit(1),
      ]);

      if (!response.documents || response.documents.length === 0) {
        return null;
      }

      return response.documents[0] as unknown as SharingInvitation;
    } catch (error) {
      console.error('Error fetching pending invitation:', error);
      return null;
    }
  }

  /**
   * Validate email format
   *
   * @param email - Email address to validate
   * @returns True if email is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
