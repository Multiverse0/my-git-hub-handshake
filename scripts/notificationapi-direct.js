import notificationapi from 'notificationapi-node-server-sdk';

// Hardcoded credentials (as requested)
notificationapi.init(
  '77lscar5yxsnwqzlt6f2tl2d9x',
  'nq7a8lye0agd50h0yhsg131ezwqt66n3ybqnhtzzbl9w582mg9r1n2by2y',
  {
    baseURL: 'https://api.eu.notificationapi.com'
  }
);

export async function sendAktivloggNotification({ to, parameters, templateId = 'welcome_aktiv' }) {
  try {
    const res = await notificationapi.send({
      type: 'aktivlogg',
      to,
      parameters,
      templateId
    });
    console.log('Notification sent:', res.data);
    return res.data;
  } catch (err) {
    console.error('Error sending notification:', err?.response?.data || err);
    throw err;
  }
}

// Simple test call (run with: node scripts/notificationapi-direct.js)
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await sendAktivloggNotification({
        to: { id: 'yngve@promonorge.no', email: 'yngve@promonorge.no' },
        parameters: {
          organizationName: 'testOrganizationName',
          recipientName: 'testRecipientName',
          '#suspensionReason': 'test#suspensionReason',
          suspensionReason: 'testSuspensionReason',
          '/suspensionReason': 'test/suspensionReason',
          adminName: 'testAdminName',
          email: 'testEmail',
          password: 'testPassword',
          loginUrl: 'testLoginUrl',
          announcementTitle: 'testAnnouncementTitle',
          announcementContent: 'testAnnouncementContent',
          changeTime: 'testChangeTime',
          newRole: 'testNewRole',
          trainingDate: 'testTrainingDate',
          duration: 'testDuration',
          discipline: 'testDiscipline',
          verifiedBy: 'testVerifiedBy',
          '#rejectionReason': 'test#rejectionReason',
          rejectionReason: 'testRejectionReason',
          '/rejectionReason': 'test/rejectionReason',
          '#notes': 'test#notes',
          notes: 'testNotes',
          '/notes': 'test/notes',
          '#memberNumber': 'test#memberNumber',
          memberNumber: 'testMemberNumber',
          '/memberNumber': 'test/memberNumber'
        },
        templateId: 'welcome_aktiv'
      });
    } catch (e) {
      process.exitCode = 1;
    }
  })();
}
