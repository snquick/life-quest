# Life Quest

A fully offline habit tracker built with Expo SDK 54. 

## How the project is structured

```
app/               Screens (expo-router tabs: Habits, Quests, Upgrades)
components/        Shared UI pieces
lib/constants.ts   All balance numbers in one place
lib/curated-habits.ts  The quest catalog (static data, six categories)
lib/db/            Schema, migrations, and all SQL (habits, player)
lib/game/          Pure math (upgrade pricing)
test-utils/        node:sqlite adapter for tests
__tests__/         Jest suites
```

## Core features
- Add custom habits with a name and a point value (validated to 5-25).
- Allows users to complete pre-curated habits if they do not wish to create a custom one
- Users can level up their characters 

## Bugs, shortcuts, and tradeoffs
- Level doesn't do anything yet.
- Didn't create user account creation due to timebox limitation 

## How AI was used
- Built with Claude Code from a custom tech spec with myself code reviewing and verifying manually in between stages. 


## What I would improve with more time
- Implement user authentication (sign in/sign up)
- Quest categories are condensed and go into a separate screen when clicked on
- Users can select preferred habit categories
- Leveling up unlocks new things such as character customization
- Statistics page
