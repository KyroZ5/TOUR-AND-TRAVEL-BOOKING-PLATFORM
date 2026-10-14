# Going Live

This guide takes the project from a local build to a working site on a real Firebase
project. Run everything from the project folder.

One note before you start: you only need a real Firebase project for the live site. For
everyday development and testing, the local emulator setup in TESTING.md works with no
Firebase project at all.

## What you need

Node.js 18 or newer, and the Firebase CLI:

```
npm install -g firebase-tools
```

You also need a Google account.

You do not need Java for any of this. Java is only used by the local emulators, which are
not involved in deploying. One heads up: this project uses version 14 of the Firebase CLI
because version 15 requires Java 21. That restriction only affects the emulators, so
deploying works fine on version 14.

## Step 1: Create the Firebase project

Go to https://console.firebase.google.com/ and click Add project. Give it a name such as
`wanderlust-travel` and continue. Google Analytics is optional and not needed here.

## Step 2: Turn on Email and Password sign-in

In the left sidebar, open Build, then Authentication, then Get started. Under Sign-in method,
enable Email/Password. Leave the email link option off.

## Step 3: Create the database

Open Build, then Firestore Database, then Create database. Choose Production mode so that
security rules are actually enforced. Pick the region closest to your users.

## Step 4: Register a web app

Open Project settings (the gear icon), go to Your apps, and pick the Web tab (the one with
the `</>` symbol). Give it a nickname such as "Wanderlust Web" and register it.

Firebase will show you a block of code that starts with `firebaseConfig = {`. Copy those
values, because you need them in the next step.

You can skip Cloud Storage entirely. This app stores image and receipt links as plain text
web addresses, so it never actually uploads files. The storage rules are still included and
tested in case you decide to add uploads later, but nothing depends on them right now.

## Step 5: Create your .env file

Copy the example file:

```
cp .env.example .env
```

Then fill in the six Firebase values you copied in step 4:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

You can leave the two optional keys blank for now. More on those at the end.

These are the public web configuration values. They are meant to be visible in the browser.
What actually keeps your data safe is the security rules, not keeping these a secret.

If these values are missing, the app will not crash. It shows a screen explaining that
Firebase is not configured and telling you what to do. That is intentional.

## Step 6: Deploy the rules and indexes

Log in and tell the CLI which project to use:

```
firebase login
firebase use --add
```

When it asks, pick your new project and give it an alias such as `live`.

Now deploy the security rules and the database indexes:

```
firebase deploy --only firestore:rules,firestore:indexes,storage
```

This uploads three things: the Firestore rules, the storage rules, and
`firestore.indexes.json`.

That last file matters more than it looks. It contains 15 composite indexes that the app's
queries depend on. Without them, everyday features like viewing your bookings or seeing
available departures will fail with a confusing "failed-precondition" error. Creating them
can take a few minutes.

You can watch the progress under Firestore, then Indexes, in the console.

## Step 7: Build and deploy the site

```
npm install
npm run build
firebase deploy --only hosting
```

The project's `firebase.json` is already set up for Firebase Hosting. It serves the build
from the `dist` folder, sends every page route back to `index.html` so the app's navigation
works on a refresh, and caches the static files for a year while never caching the page
itself.

Firebase will print your live address, something like `https://your-project.web.app`.

If you would rather host it on Netlify, Vercel, or somewhere else, that works too. The `dist`
folder is a normal static site. The only requirement is that your host rewrites all paths to
`index.html`, and that the Firebase variables are set when the build runs.

## Step 8: Create the first administrator

When someone registers through the site, they always become a customer. There is no way to
sign up as an admin directly. To make your first admin:

Register through the live site as a normal user. Then open Firestore in the console, find
the `users` collection, and open the document whose name matches that user's ID. Change the
`role` field from `customer` to `admin`. Sign out and sign back in, and the admin area at
/admin will be available.

You may also want to add a document called `site` in the `settings` collection to control
the text on the public homepage. If you skip this, the app uses sensible defaults.

## Step 9: Optional API keys

The site works without these, and both features degrade quietly when they are missing. But
two public pages get nicer with them.

For the destination search box, get a free key from https://www.geoapify.com/ and set
`VITE_LOCATION_API_KEY`.

For the weather card on destination pages, get a free key from
https://openweathermap.org/api/ and set `VITE_WEATHER_API_KEY`.

Add them to your `.env` file and rebuild. It is worth restricting both keys to your site's
domain in the provider dashboards so nobody else can use them.

## Checking that it worked

Walk through this list on the live site:

The homepage loads and shows destinations and packages.

You can register, log in, and see your account dashboard.

Booking a package works, and the seat count on that departure goes up.

Your bookings, notifications and profile pages all load without errors in the browser
console.

Promoting a user to admin gives them access to the admin area.

Admin pages work for destinations, packages, departures, bookings and payments.

The reports page loads and the CSV download works. This is the heaviest query in the app, so
it is a good test that the indexes built correctly.

There should be no "failed-precondition" errors in the browser console. Those would mean an
index is still building or missing.

## If something goes wrong

If the console shows a "failed-precondition" error mentioning an index, either the index is
still building or a new query needs one that does not exist yet. The error message contains a
direct link to create it. Follow the link, wait for it to finish, and try again.

If the site loads but is blank, the Firebase variables were almost certainly missing when
the build ran. Recheck step 5, rebuild, and redeploy.

If you see the screen saying Firebase is not configured, that is the same problem. The app
is telling you the variables were not available at build time.

If login fails with "operation-not-allowed", you have not enabled the Email and Password
provider yet. Go back to step 2.

If the admin area stays locked, the user's role is still set to customer. Go back to step 8.

If a write is denied by the rules, make sure the deployed rules match your local files by
running the deploy command from step 6 again.

## Starting over

Data in the emulators disappears when you stop them, so re-running `npm run seed:emu` gives
you a fresh demo set. Data on the live site is permanent. If you need a clean start, clear
the collections from the Firestore console.
