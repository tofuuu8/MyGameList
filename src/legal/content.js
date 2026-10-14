// The text of the Privacy Policy and Terms of Service.
// Lines starting with "• " are shown as bullet points.
// This is a starting template, not legal advice. Have it reviewed before a wide public release.

function getPrivacyPolicy(c) {
  return {
    title: 'Privacy Policy',
    updated: `Last updated: ${c.lastUpdated}`,
    sections: [
      {
        heading: '1. About this policy',
        body: [
          `${c.appName} is a mobile app that helps you keep track of your PC game library. This policy explains what information we collect, how we use it, and the choices you have.`,
          `${c.appName} is run by ${c.developerName} ("we", "us"). You can contact us at ${c.contactEmail}. By using the app, you agree to this policy.`,
        ],
      },
      {
        heading: '2. Information we collect',
        body: [
          '• Account details: your email address, the username you choose, and your password. Passwords are handled by our sign-in provider and stored in scrambled (hashed) form. We cannot see them.',
          ...(c.googleSignIn ? ['• Google sign-in: if you choose to sign in with Google, Google shares your name, email address and profile picture link with us.'] : []),
          '• Your library: the games you add, with their title, genre, cover image link, play status, installed status, rating, hours played and notes.',
          '• Your PC details: the RAM, graphics card, graphics memory, processor and free disk space you enter in the My PC screen.',
          '• On your device: your sign-in session, your theme choice (Light, Dark or System), and saved copies of game lists for up to 12 hours so the app loads faster.',
          '• Basic technical logs: our hosting provider may keep standard server logs, such as request times and IP addresses, for security and troubleshooting.',
          `We do not collect your precise location, contacts, photos, camera or microphone data, or payment details. ${c.appName} has no advertising and no analytics or tracking tools.`,
        ],
      },
      {
        heading: '3. How we use your information',
        body: [
          '• To run the app: sign you in, save your library, show your stats, and estimate whether your PC can run a game.',
          '• To send emails you ask for, such as verification codes and password reset codes.',
          '• To keep the service secure, prevent misuse, and fix problems.',
          '• To follow the law when we have to.',
        ],
      },
      {
        heading: '4. Services we rely on',
        body: [
          `We use these providers to run ${c.appName}. They handle information only to provide their service to us.`,
          '• Supabase: stores your account and data, and runs our sign-in and server functions.',
          c.googleSignIn
            ? '• Google: provides Google sign-in if you choose it, and delivers our emails through Gmail.'
            : '• Google (Gmail): delivers our verification and password reset emails.',
          '• RAWG (rawg.io): provides game information. Your game searches are sent to RAWG from our server, without your account details. Game data is provided by RAWG.',
          'These providers may store information on servers outside your country. We do not sell your personal information, and we do not share it for advertising.',
        ],
      },
      {
        heading: '5. When we share information',
        body: [
          'We share information only with the providers above, when the law requires it, or if the app is sold or transferred to someone else (in which case this policy would continue to protect your information).',
        ],
      },
      {
        heading: '6. How long we keep it, and deleting your data',
        body: [
          'We keep your information while your account exists.',
          'You can delete your account at any time in the app: open Profile, then tap Delete account. This permanently deletes your account, your library and your PC details. Copies in routine backups may remain for a limited time before they are removed.',
          `You can also ask us to delete your data by emailing ${c.contactEmail}.`,
        ],
      },
      {
        heading: '7. Your choices and rights',
        body: [
          'You can view and change your games, PC details and password inside the app, and you can delete your account.',
          `Depending on where you live, you may have more rights, such as asking for a copy of your data, asking us to correct it, or objecting to how we use it. To use any of these, contact us at ${c.contactEmail}.`,
          'If you are in the Philippines, you have rights under the Data Privacy Act of 2012 (Republic Act No. 10173), including the rights to be informed, to access your data, to correct it, to object to its use, to have it erased or blocked, and to receive a copy of it.',
        ],
      },
      {
        heading: '8. Security',
        body: [
          'We use reasonable measures to protect your information, including encrypted connections and database rules that let each person access only their own data. No system is perfectly secure, so we cannot guarantee absolute security.',
        ],
      },
      {
        heading: "9. Children",
        body: [
          `${c.appName} is not meant for children under 13, or under the minimum age for online services in your country. We do not knowingly collect information from them. If you believe a child has given us information, contact us and we will delete it.`,
        ],
      },
      {
        heading: '10. Changes to this policy',
        body: [
          'We may update this policy from time to time. We will change the "Last updated" date, and for important changes we will tell you in the app.',
        ],
      },
      {
        heading: '11. Contact us',
        body: [`Questions about this policy? Email ${c.contactEmail}.`],
      },
    ],
  };
}

function getTerms(c) {
  return {
    title: 'Terms of Service',
    updated: `Last updated: ${c.lastUpdated}`,
    sections: [
      {
        heading: '1. Agreeing to these terms',
        body: [
          `By creating an account or using ${c.appName}, you agree to these terms and to our Privacy Policy. If you do not agree, please do not use the app.`,
        ],
      },
      {
        heading: '2. What the app is',
        body: [
          `${c.appName} helps you organize your PC game library, track what you play, and discover games. It is run by ${c.developerName}.`,
          `${c.appName} is not connected to Steam, Epic Games, GOG, RAWG, or any game publisher. Game names, images and trademarks belong to their owners.`,
        ],
      },
      {
        heading: '3. Your account',
        body: [
          '• Give accurate information when you sign up.',
          '• Keep your password private. You are responsible for what happens on your account.',
          '• You must be at least 13 years old, or the minimum age for online services in your country.',
          '• Tell us if you think someone else is using your account.',
        ],
      },
      {
        heading: '4. Your content',
        body: [
          'The games, ratings, notes and PC details you add are yours. You give us permission to store and show them to you so the app can work.',
          'Do not put unlawful, harmful or abusive content in your notes.',
        ],
      },
      {
        heading: '5. Using the app fairly',
        body: [
          'Please do not:',
          '• Break the law or break other people\'s rights.',
          '• Try to get into other people\'s accounts or data, or get around the app\'s security.',
          '• Overload the app or its servers, or use bots or scripts to collect data from it.',
          '• Copy, reverse engineer or resell the app, except where the law allows it.',
        ],
      },
      {
        heading: '6. Game information and "Can run" results',
        body: [
          'Game details, covers and system requirements come from third parties and can be incomplete or wrong.',
          'The "Can run" and "Might struggle" labels are rough estimates based only on RAM, graphics memory and free disk space. They are not a promise that a game will run well on your PC. Please check the publisher\'s official requirements before you buy a game.',
        ],
      },
      {
        heading: '7. Changes and availability',
        body: [
          'We may change, pause or stop parts of the app at any time. We try to keep it running well, but we cannot promise it will always be available or free of errors.',
        ],
      },
      {
        heading: '8. Ending your account',
        body: [
          'You can delete your account at any time in the app (Profile, then Delete account). We may suspend or close accounts that break these terms. When an account is deleted, its data is removed as described in our Privacy Policy.',
        ],
      },
      {
        heading: '9. No warranties',
        body: [
          `${c.appName} is provided "as is" and "as available", without promises of any kind, to the fullest extent the law allows.`,
        ],
      },
      {
        heading: '10. Limit of liability',
        body: [
          'To the fullest extent the law allows, we are not responsible for indirect or accidental losses, or for lost data, lost profits or buying decisions made using the app. Where the law allows us to limit our responsibility, our total responsibility for any claim is limited to the amount you paid us to use the app, which is nothing for the free version.',
        ],
      },
      {
        heading: '11. Changes to these terms',
        body: [
          'We may update these terms. We will change the "Last updated" date, and if you keep using the app after a change, you accept the new terms.',
        ],
      },
      {
        heading: '12. Governing law',
        body: [`These terms are governed by ${c.governingLaw}.`],
      },
      {
        heading: '13. Contact us',
        body: [`Questions about these terms? Email ${c.contactEmail}.`],
      },
    ],
  };
}

module.exports = { getPrivacyPolicy, getTerms };
