This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Shared tank calibration

Calibration is stored in Supabase so all devices use the same empty/full distances. To set up the shared table, run [`supabase/migrations/20261114100000_shared_tank_calibration.sql`](./supabase/migrations/20261114100000_shared_tank_calibration.sql) in the Supabase SQL Editor. The dashboard loads the shared value on startup, publishes updates to connected devices in real time, and imports an existing browser calibration if the shared value has not been created yet.

This dashboard currently uses the Supabase anonymous key without user sign-in. The migration therefore grants anonymous clients permission to read and update the single `tanque01` calibration row. Anyone with access to the dashboard can change that calibration; enable authentication and tighten the table policies if that is not acceptable for your deployment.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
