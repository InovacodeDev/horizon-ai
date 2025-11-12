# Joint Accounts Sharing System

## Overview

The Joint Accounts Sharing System enables users to share their complete financial data with family members or partners. This feature creates a bidirectional relationship where both users can view each other's accounts, transactions, credit cards, and invoices while maintaining clear ownership boundaries.

## Key Concepts

### Roles

- **Responsible User**: The primary account holder who initiates and manages the sharing relationship. A responsible user can invite multiple members.
- **Member User**: A user who has been invited and accepted to share data with a responsible user. A member can only be linked to one responsible user at a time.

### Relationship Types

- **Active Relationship**: A currently enabled sharing relationship that allows bidirectional data access between users.
- **Pending Invitation**: An invitation that has been sent but not yet accepted or rejected.
- **Terminated Relationship**: A previously active relationship that has been ended by either party.

### Data Ownership

All financial data maintains its original ownership:

- Accounts belong to the user who created them
- Transactions belong to the user who created them
- Credit cards belong to the account owner
- Invoices belong to the user who uploaded them

**Important**: Users can only modify their own data. Shared data is visible in read-only mode.

## Getting Started

### For Responsible Users (Inviting Someone)

#### Step 1: Navigate to Family Management

1. Log in to your account
2. Click on "Família" in the main navigation menu
3. You'll see the Family Management page

#### Step 2: Create an Invitation

1. Click the "Convidar Membro" button
2. Enter the email address of the person you want to invite
3. Click "Enviar Convite"

**Requirements**:

- The email must belong to an existing user in the system
- The invited user must not already have an active relationship with another responsible user
- You cannot invite yourself

#### Step 3: Manage Invitations

After sending an invitation, you can:

- **View pending invitations**: See all invitations waiting for acceptance
- **Resend invitation**: Send the invitation email again if needed
- **Cancel invitation**: Cancel a pending invitation before it's accepted

The invitation will expire automatically after 7 days if not accepted.

#### Step 4: Manage Active Members

Once a member accepts your invitation:

- View all active members in the "Membros Ativos" section
- See each member's name, email, and relationship start date
- Terminate relationships if needed

### For Member Users (Accepting an Invitation)

#### Step 1: Receive Invitation Email

You'll receive an email with:

- The responsible user's name and email
- A secure invitation link
- Instructions on how to accept or reject

#### Step 2: Review Invitation Details

1. Click the invitation link in the email
2. You'll see the invitation details page showing:
   - Who invited you
   - What data will be shared (bidirectional access)
   - Accept and Reject buttons

#### Step 3: Accept or Reject

**To Accept**:

1. Click "Aceitar Convite"
2. You'll be redirected to the Family Management page
3. You can now view the responsible user's financial data

**To Reject**:

1. Click "Rejeitar Convite"
2. The invitation will be marked as rejected
3. You can accept other invitations if desired

**Important**: You can only have one active relationship at a time. If you already have an active relationship, you must terminate it before accepting a new invitation.

## Using Shared Data

### Viewing Shared Accounts

1. Navigate to "Contas" (Accounts)
2. You'll see all accounts from both users
3. Each account displays an ownership badge:
   - "Sua" for your own accounts
   - Owner's name for shared accounts

**Features**:

- View balances from all accounts
- Total balance includes both users' accounts
- Filter by ownership if needed

### Viewing Shared Transactions

1. Navigate to "Transações" (Transactions)
2. All transactions from both users are displayed
3. Ownership column shows who created each transaction

**Features**:

- View all transaction details
- Filter transactions by date, category, or account
- Toggle to show only your own transactions
- Edit/delete buttons are disabled for shared transactions

### Viewing Shared Credit Cards

1. Navigate to "Faturas de Cartão" (Credit Card Bills)
2. All credit cards from both users are displayed
3. Ownership badges indicate the card owner

**Features**:

- View all credit card bills
- See payment history
- Edit/delete buttons are disabled for shared cards

### Viewing Shared Invoices

1. Navigate to "Notas Fiscais" (Invoices)
2. All invoices from both users are displayed
3. Ownership indicators show who uploaded each invoice

**Features**:

- View invoice details
- Compare prices across both users' purchases
- Delete button is disabled for shared invoices

### Dashboard and Analytics

The dashboard and analytics pages automatically include shared data:

- **Overview**: Combined statistics from both users
- **Cash Flow Projection**: Includes all accounts and transactions
- **Analytics**: Category breakdowns include shared spending
- **Toggle Option**: Switch between combined view and own data only

## Managing Your Relationship

### Viewing Relationship Status

Navigate to "Família" to see:

- **As Responsible User**: List of active members and pending invitations
- **As Member User**: Details of the responsible user you're linked to

### Terminating a Relationship

Either party can terminate the relationship at any time:

1. Navigate to "Família"
2. Click "Encerrar Relacionamento"
3. Confirm the termination in the modal dialog

**What Happens**:

- Data access is immediately revoked for both users
- Historical data is preserved but no longer accessible
- Both users receive email notifications
- Members can accept new invitations after termination
- Responsible users maintain relationships with other members

**Important**: Termination is permanent and cannot be undone. You'll need to create a new invitation to re-establish the relationship.

## Data Ownership and Permissions

### What You Can Do

#### With Your Own Data

- ✅ Create new accounts, transactions, credit cards, and invoices
- ✅ Edit your own financial data
- ✅ Delete your own financial data
- ✅ View all details and history

#### With Shared Data

- ✅ View all details and history
- ✅ Include in calculations and reports
- ✅ Export combined data
- ❌ Edit shared data
- ❌ Delete shared data
- ❌ Modify shared accounts or transactions

### Security and Privacy

- All data access requires an active relationship
- Invitations expire after 7 days for security
- Invitation tokens are cryptographically secure
- Termination immediately revokes all access
- All relationship events are logged for audit purposes

## Frequently Asked Questions (FAQ)

### General Questions

**Q: Can I share data with multiple people?**
A: Yes, if you're a responsible user, you can invite unlimited members. However, each member can only be linked to one responsible user at a time.

**Q: Can I be both a responsible user and a member?**
A: No, you can only have one role at a time. If you're a member, you cannot invite others until you terminate your current relationship.

**Q: What happens to my data if I terminate the relationship?**
A: Your data remains completely intact. Only the access permissions change - the other user can no longer view your data, and you can no longer view theirs.

**Q: Can I re-invite someone after terminating the relationship?**
A: Yes, you can create a new invitation after termination. The new relationship will start fresh with a new start date.

### Invitation Questions

**Q: How long is an invitation valid?**
A: Invitations expire after 7 days. You can resend the invitation if it expires.

**Q: Can I cancel an invitation after sending it?**
A: Yes, you can cancel pending invitations at any time before they're accepted.

**Q: What if the invited person doesn't have an account?**
A: The invited email must belong to an existing user. They need to create an account first before accepting invitations.

**Q: Can I invite someone who already has a relationship?**
A: No, if the person already has an active relationship with another responsible user, they must terminate that relationship first.

### Data Access Questions

**Q: Can I hide shared data from my view?**
A: Yes, most pages have filters or toggles to show only your own data. You can also configure default preferences in Settings.

**Q: Will shared transactions affect my budget calculations?**
A: By default, yes. Shared data is included in all calculations. You can toggle this in Settings or use filters to exclude shared data.

**Q: Can I edit a shared transaction?**
A: No, you can only edit your own transactions. Shared transactions are read-only.

**Q: What if I accidentally delete my account?**
A: Deleting your account will automatically terminate all sharing relationships. The other users will lose access to your data immediately.

### Technical Questions

**Q: Is my data secure?**
A: Yes, all data access is protected by:

- Authentication requirements
- Row-level security in the database
- Encrypted invitation tokens
- Audit logging of all relationship events

**Q: What happens if both users try to terminate at the same time?**
A: The system handles concurrent terminations gracefully. The relationship will be terminated once, and both users will receive notifications.

**Q: Can I export combined financial reports?**
A: Yes, all export features include shared data by default. You can generate combined reports for tax purposes or financial planning.

**Q: Does the system support multiple currencies?**
A: Yes, the sharing system works with all supported currencies. Each user's data maintains its original currency.

## Troubleshooting

### Invitation Issues

**Problem**: "Este usuário já possui uma conta conjunta ativa"

- **Solution**: The invited user already has an active relationship. They need to terminate it first before accepting your invitation.

**Problem**: "Usuário não encontrado com este email"

- **Solution**: The email doesn't belong to an existing user. Ask them to create an account first.

**Problem**: "Este convite expirou"

- **Solution**: The invitation expired after 7 days. Request the responsible user to resend the invitation.

### Access Issues

**Problem**: Can't see shared data after accepting invitation

- **Solution**: Try refreshing the page or logging out and back in. If the issue persists, check that the relationship is still active in the Family page.

**Problem**: Edit buttons are disabled for my own data

- **Solution**: Verify that you're viewing your own data, not shared data. Check the ownership badge on the item.

### Relationship Issues

**Problem**: Can't terminate relationship

- **Solution**: Ensure you're logged in as either the responsible user or the member in that relationship. Only participants can terminate.

**Problem**: Can't accept new invitation

- **Solution**: You may already have an active relationship. Terminate your current relationship first before accepting a new invitation.

## Best Practices

### For Responsible Users

1. **Communicate clearly**: Discuss data sharing expectations with members before inviting them
2. **Review regularly**: Periodically review your active members list
3. **Terminate promptly**: End relationships when they're no longer needed
4. **Use descriptive names**: Ensure your profile name is clear so members know who invited them

### For Member Users

1. **Verify invitations**: Always check who sent the invitation before accepting
2. **Understand implications**: Remember that data sharing is bidirectional - they'll see your data too
3. **Review permissions**: Understand that you can only view, not modify, shared data
4. **Communicate changes**: Let the responsible user know if you plan to terminate the relationship

### For All Users

1. **Keep data organized**: Use clear naming conventions for accounts and transactions
2. **Use categories consistently**: This helps with combined analytics
3. **Regular reviews**: Periodically review shared data to ensure accuracy
4. **Respect privacy**: Remember that shared data is sensitive - discuss major financial decisions together

## Support

If you encounter issues not covered in this documentation:

1. Check the FAQ section above
2. Review the API documentation for technical details
3. Contact support with specific error messages
4. Include your user ID and relationship ID when reporting issues

## Related Documentation

- [API Implementation Guide](./API_IMPLEMENTATION.md) - Technical API documentation
- [Security Verification Report](./SECURITY-VERIFICATION-REPORT.md) - Security audit details
- [Development Guide](./DEVELOPMENT-GUIDE.md) - For developers implementing features

---

**Last Updated**: November 2025
**Version**: 1.0.0
