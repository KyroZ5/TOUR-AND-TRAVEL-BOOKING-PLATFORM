# Testing Guide

This project has three kinds of automated tests plus a manual checklist you can walk through
in the browser.

The important thing to know up front: you do not need a real Firebase project, and you do not
need any API keys, to run any of this. Everything runs on your own machine against local
emulators.

## The three kinds of tests

Unit and component tests check that small pieces of code work correctly — things like
formatting money, handling dates, and form validation — and that shared UI components render
the way they should. Run them with `npm test`.

Security rules tests check who is allowed to do what. Can a customer read another customer's
booking? Can a customer edit a destination? Only an admin should be able to. Run them with
`npm run test:rules`.

Integration tests run a real booking from beginning to end against a local Firestore
database, including reserving seats when you book and releasing them when you cancel. Run
them with `npm run test:integration`.

As of now the suite has 99 unit and component tests, 40 rules tests, and 8 integration tests.

## What you need installed

Node.js 18 or newer. You also need Java 17 or newer, but only for the emulator tests — the
Firestore emulator is a Java program. You do not need Java just to run the app or to run
`npm test`.

You never need to log in to Firebase to run these tests. Every emulator command uses a
placeholder project id called `demo-tour-travel`, which forces everything to run offline.

## Running the tests

Open a terminal in the project folder and pick the one you need:

```
npm test                 run unit and component tests once
npm run test:watch       keep running, re-test every time you save a file
npm run test:coverage    run once and also write a coverage report
npm run test:rules       start emulators, test the security rules, shut down
npm run test:integration start emulators, run the booking flow test
```

## Clicking around the app yourself

If you would rather try the app by hand than run tests, you need three terminals.

In the first one, start the emulators:

```
npm run emulators
```

In the second one, load the demo data. Do this once, while the first terminal is still
running:

```
npm run seed:emu
```

In the third one, start the app:

```
npm run dev:emu
```

Then open http://localhost:5173 in your browser.

One thing that trips people up: use `localhost`, not `127.0.0.1`. The dev server listens on
the IPv6 address, so `http://127.0.0.1:5173` will look like it is not running when it
actually is.

You can also open http://127.0.0.1:4000 to see the Emulator UI, which shows the data
changing in real time as you click around.

The seed script creates two accounts you can sign in with:

```
admin@wanderlust.test     Admin1234
customer@wanderlust.test  Customer1234
```

Emulator data lives in memory, so it disappears every time you stop the emulators. Just run
`npm run seed:emu` again if you want it back.

## What the tests cover

The unit tests cover the currency helper (centavos to peso and back), the date helper, the
form validators, booking reference generation, report calculations, and the seat availability
math.

The component tests cover the status chip, the confirmation dialog, and the paginated table.

The rules tests cover every collection: user profiles, destinations, tour packages,
departures, bookings, payments, notifications, settings, and the activity log. They check
both the allowed cases and the denied ones, including things like a customer being unable to
change someone else's booking, and seats never being able to go below zero or above the
departure capacity.

The integration test books a trip and confirms that seats are reserved, then cancels and
confirms the seats come back. It also checks that trying to overbook is refused, and that
the price is recalculated from the stored package rather than trusting whatever the client
sent.

## Manual checklist

Use this while the app is running against the emulators.

For the public site: the homepage should show destinations, packages and promotions. The
destinations page should filter when you type in the search box. A destination page should
show its map and weather card. A package page should show the gallery, itinerary and booking
form.

For booking: sign in as the customer and book a package. The booking should appear as
pending, and the seat count on that departure should go up. Keep booking until the departure
is full, and the next attempt should be refused.

For cancellation: cancel a booking and the seat count should go back down. Cancellation is
only allowed up to 7 days before departure.

For payments: submit a payment on a booking and it should show as awaiting verification.

For the admin area: sign in as the admin and confirm one pending booking — seats should stay
the same. Reject another — seats should be released. Approve a payment and the booking's
payment status should update. Check that the reports page loads and that the CSV export
downloads.

For access control: while logged out, trying to visit the account or admin area should
redirect you. A customer trying to visit the admin area should also be blocked. A customer
should not be able to open another customer's booking.

## Bugs these tests already caught

While writing the tests, three real bugs turned up and were fixed.

The security rules originally only let customers increase the seat count on a departure, not
decrease it. That meant nobody could actually cancel a booking. The rule now allows the count
to move in either direction, as long as it stays between zero and the departure capacity.

The booking service checked for an existing booking reference by searching the bookings
collection directly, but the security rules forbid that kind of search for regular users.
Every booking attempt would have failed. That check was replaced with a random reference
generator that does not need to search.

The notifications rule only allowed one type of notification to be created, so the message a
customer gets when they cancel never made it through. It now allows both.

## Common problems

If the emulator tests fail with a Java version error, install Java 17 or newer. If you
already have Java 21, you can upgrade `firebase-tools` to version 15 or higher.

If you see a message about a port already being in use, an older emulator session is probably
still running. Close it, or change the ports in `firebase.json`.

If you changed a `.rules` file and the tests still seem to use the old version, just run the
test command again. The rules are read from disk each time the test environment starts.

If the storage rules tests fail with a message about Firestore already being started, that
means a single test process tried to configure both Firestore and Storage test environments
at once. This project keeps the storage tests storage-only to avoid that, so you should not
see it unless you change that structure.
