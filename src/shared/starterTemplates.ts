/**
 * Optional starter library. Offered during onboarding (unchecked by default) and in Settings.
 * Every template is editable. Variables are left for the user to fill: nothing is invented.
 */
export interface StarterTemplate {
  folder: string;
  title: string;
  description: string;
  shortcut: string | null;
  tags: string[];
  body: string;
}

export const STARTER_FOLDERS = [
  'LinkedIn',
  'Recruitment',
  'Sales',
  'Clients',
  'Billing',
  'Support',
  'Everyday',
] as const;

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    folder: 'LinkedIn',
    title: 'LinkedIn connection request',
    description: 'Short, personal note for a connection request (under 300 characters).',
    shortcut: '/connect',
    tags: ['linkedin', 'networking'],
    body: 'Hi {{first_name}}, I came across your work at {{company}} and would like to connect. I work with founders on {{topic}} and enjoy learning from people in your field. {{sender_name}}',
  },
  {
    folder: 'LinkedIn',
    title: 'LinkedIn outreach',
    description: 'First message after a connection is accepted.',
    shortcut: '/intro',
    tags: ['linkedin', 'outreach'],
    body:
      'Hi {{first_name}},\n\nThanks for connecting. I noticed {{observation}} at {{company}}.\n\nI help businesses with {{service}}. Would it be useful if I sent a short idea for {{specific_process}}?\n\nBest,\n{{sender_name}}',
  },
  {
    folder: 'Recruitment',
    title: 'Job application',
    description: 'Cover note for applying to a role.',
    shortcut: '/application',
    tags: ['jobs'],
    body:
      'Dear {{first_name}},\n\nI am applying for the {{job_title}} role at {{company}}. I bring experience in {{relevant_experience}}, and I would welcome the chance to support your team.\n\nMy CV is attached. Thank you for your time and consideration.\n\nKind regards,\n{{sender_name}}',
  },
  {
    folder: 'Recruitment',
    title: 'Recruitment outreach',
    description: 'Approach a candidate about an open role.',
    shortcut: '/recruit',
    tags: ['recruitment', 'outreach'],
    body:
      'Hi {{first_name}},\n\nI am reaching out about a {{job_title}} opportunity with {{company}}. Your background in {{candidate_strength}} stood out.\n\nWould you be open to a short call this week to hear more?\n\nBest regards,\n{{sender_name}}',
  },
  {
    folder: 'Recruitment',
    title: 'Interview invitation',
    description: 'Invite a candidate to interview.',
    shortcut: '/interview',
    tags: ['recruitment', 'interview'],
    body:
      'Hi {{first_name}},\n\nThank you for applying for the {{job_title}} role. We would like to invite you to an interview on {{date}}.\n\nYou can join here: {{meeting_link}}\n\nPlease reply to confirm, or let me know if another time works better.\n\nBest regards,\n{{sender_name}}',
  },
  {
    folder: 'Clients',
    title: 'Client onboarding welcome',
    description: 'Welcome a new client and set the first steps.',
    shortcut: '/welcome',
    tags: ['onboarding'],
    body:
      'Hi {{first_name}},\n\nWelcome aboard, and thank you for choosing us. Here is what happens next:\n\n1. Complete the onboarding form: {{form_link}}\n2. Book your kickoff call: {{meeting_link}}\n3. Share access to the tools listed in the form.\n\nI am glad to be working with {{company}}.\n\nBest,\n{{sender_name}}',
  },
  {
    folder: 'Sales',
    title: 'Discovery call invitation',
    description: 'Offer a short discovery call.',
    shortcut: '/discovery',
    tags: ['sales', 'call'],
    body:
      'Hi {{first_name}},\n\nThanks for your interest. A 20 minute discovery call is the best next step so I can understand how {{company}} works today and where you want to improve.\n\nPick a time that suits you: {{meeting_link}}\n\nBest,\n{{sender_name}}',
  },
  {
    folder: 'Sales',
    title: 'Sales follow-up',
    description: 'Polite follow-up after no reply.',
    shortcut: '/followup',
    tags: ['sales', 'follow-up'],
    body:
      'Hi {{first_name}},\n\nFollowing up on my note about {{topic}}. One practical improvement for {{company}} could be {{suggestion}}.\n\nIf this is a current priority, would you be open to a short call?\n\nBest,\n{{sender_name}}',
  },
  {
    folder: 'Billing',
    title: 'Invoice reminder',
    description: 'Friendly reminder before or on the due date.',
    shortcut: '/invoice',
    tags: ['billing'],
    body:
      'Hi {{first_name}},\n\nA quick reminder that invoice {{invoice_number}} for {{amount}} is due on {{date}}.\n\nPlease let me know if you need the payment details resent.\n\nThank you,\n{{sender_name}}',
  },
  {
    folder: 'Support',
    title: 'Customer support reply',
    description: 'Acknowledge a support request and set expectations.',
    shortcut: '/support',
    tags: ['support'],
    body:
      'Hi {{first_name}},\n\nThank you for reaching out. I understand the issue is {{issue_summary}}.\n\nI am looking into it now and will update you by {{date}}. If you have any screenshots or extra details, please reply to this message.\n\nBest regards,\n{{sender_name}}',
  },
  {
    folder: 'Everyday',
    title: 'Thank-you message',
    description: 'Thank someone for their time or help.',
    shortcut: '/thanks',
    tags: ['courtesy'],
    body: 'Hi {{first_name}},\n\nThank you for {{reason}}. I really appreciate it.\n\nBest,\n{{sender_name}}',
  },
  {
    folder: 'Everyday',
    title: 'Professional apology',
    description: 'Take ownership and state the fix.',
    shortcut: '/sorry',
    tags: ['courtesy'],
    body:
      'Hi {{first_name}},\n\nI am sorry about {{issue_summary}}. That is not the standard I hold myself to.\n\nHere is what I am doing to fix it: {{fix}}.\n\nThank you for your patience,\n{{sender_name}}',
  },
  {
    folder: 'Everyday',
    title: 'Meeting reschedule',
    description: 'Move a meeting with a new time option.',
    shortcut: '/reschedule',
    tags: ['meetings'],
    body:
      'Hi {{first_name}},\n\nSomething has come up and I need to move our meeting. Would {{date}} work for you instead?\n\nYou can also pick another time here: {{meeting_link}}\n\nSorry for the change, and thank you for understanding.\n\nBest,\n{{sender_name}}',
  },
];
