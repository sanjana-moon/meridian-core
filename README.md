meridian-core/
│
├── public/
│   ├── images/
│   ├── icons/
│   └── logo/
│
├── src/
│   │
│   ├── app/                                  # NEXT.JS APP ROUTER
│   │   │
│   │   ├── (marketing)/                      # PUBLIC MARKETING
│   │   │   ├── layout.tsx                    # navbar + footer shell
│   │   │   ├── page.tsx                      # HOME — hero + features
│   │   │   └── features/
│   │   │       └── [slug]/page.tsx           # dynamic feature detail
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── two-factor/page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                    # dashboard shell (sidebar)
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── customers/page.tsx
│   │   │   │   ├── accounts/page.tsx
│   │   │   │   ├── loans/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   ├── staff/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── customers/page.tsx
│   │   │   │   ├── transactions/page.tsx
│   │   │   │   └── loans/page.tsx
│   │   │   └── customer/
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── accounts/page.tsx
│   │   │       ├── transfer/page.tsx
│   │   │       ├── transactions/page.tsx
│   │   │       ├── loans/page.tsx
│   │   │       └── settings/page.tsx
│   │   │
│   │   ├── api/                              # HTTP ROUTE HANDLERS
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts
│   │   │   │   └── register/route.ts
│   │   │   ├── users/route.ts
│   │   │   ├── accounts/
│   │   │   │   ├── route.ts
│   │   │   │   └── [accountId]/route.ts
│   │   │   ├── transactions/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [transactionId]/route.ts
│   │   │   │   ├── transfer/route.ts
│   │   │   │   ├── deposit/route.ts
│   │   │   │   └── withdrawal/route.ts
│   │   │   ├── loans/
│   │   │   │   ├── route.ts
│   │   │   │   └── [loanId]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── approve/route.ts
│   │   │   │       └── reject/route.ts
│   │   │   ├── admin/settings/route.ts
│   │   │   ├── notifications/
│   │   │   │   ├── route.ts
│   │   │   │   └── [notificationId]/route.ts
│   │   │   └── two-factor/
│   │   │       ├── status/route.ts
│   │   │       ├── setup/route.ts
│   │   │       ├── verify/route.ts
│   │   │       └── disable/route.ts
│   │   │
│   │   ├── layout.tsx                        # ROOT — fonts + providers
│   │   └── globals.css
│   │
│   ├── server/                               # BACKEND (SERVER-ONLY)
│   │   ├── auth/
│   │   │   └── auth.config.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── account.controller.ts
│   │   │   ├── transaction.controller.ts
│   │   │   ├── loan.controller.ts
│   │   │   ├── settings.controller.ts
│   │   │   └── two-factor.controller.ts
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── account.service.ts
│   │   │   ├── transaction.service.ts
│   │   │   ├── loan.service.ts
│   │   │   ├── settings.service.ts
│   │   │   └── two-factor.service.ts
│   │   │
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   ├── account.repository.ts
│   │   │   ├── transaction.repository.ts
│   │   │   ├── loan.repository.ts
│   │   │   ├── settings.repository.ts
│   │   │   └── notification.repository.ts
│   │   │
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── account.model.ts
│   │   │   ├── transaction.model.ts
│   │   │   ├── loan.model.ts
│   │   │   ├── settings.model.ts
│   │   │   └── notification.model.ts
│   │   │
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── with-transaction.ts
│   │   │   ├── schema.sql
│   │   │   └── indexes.sql
│   │   │
│   │   ├── security/
│   │   │   ├── password.ts
│   │   │   ├── pin.ts
│   │   │   ├── totp.ts
│   │   │   ├── encryption.ts
│   │   │   └── recovery-codes.ts
│   │   │
│   │   └── utils/
│   │       ├── money.ts
│   │       ├── generate-reference.ts
│   │       ├── api-response.ts
│   │       └── logger.ts
│   │
│   ├── lib/                                  # CLIENT-SAFE SHARED
│   │   ├── validations/
│   │   │   ├── auth.schema.ts
│   │   │   ├── account.schema.ts
│   │   │   ├── transaction.schema.ts
│   │   │   ├── transfer.schema.ts
│   │   │   ├── loan.schema.ts
│   │   │   └── settings.schema.ts
│   │   ├── constants/
│   │   │   ├── roles.ts
│   │   │   ├── transaction-types.ts
│   │   │   ├── loan-status.ts
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── site.ts
│   │   │   └── features.ts                   # marketing feature list
│   │   └── utils.ts
│   │
│   ├── components/                           # VIEW
│   │   ├── ui/                               # shadcn primitives
│   │   ├── shared/                           # StatCard, StatusBadge, DataTable
│   │   ├── layout/                           # Sidebar, Header, MobileNav
│   │   ├── marketing/                        # navbar, footer, hero, cards
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── hero.tsx
│   │   │   ├── feature-card.tsx
│   │   │   └── section-heading.tsx
│   │   ├── charts/                           # Recharts wrappers
│   │   ├── admin/
│   │   ├── staff/
│   │   └── customer/
│   │
│   ├── features/                             # FRONTEND FEATURE MODULES
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── accounts/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── transactions/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── loans/
│   │       ├── components/
│   │       └── hooks/
│   │
│   ├── store/                                # REDUX TOOLKIT
│   │   ├── index.ts
│   │   ├── api/
│   │   │   ├── base-api.ts
│   │   │   ├── auth.api.ts
│   │   │   ├── accounts.api.ts
│   │   │   ├── transactions.api.ts
│   │   │   ├── loans.api.ts
│   │   │   ├── two-factor.api.ts
│   │   │   └── settings.api.ts
│   │   └── slices/
│   │       ├── ui.slice.ts
│   │       └── auth.slice.ts
│   │
│   ├── providers/
│   │   └── index.tsx                         # Theme + Redux + Session
│   │
│   ├── hooks/
│   │   ├── use-current-user.ts
│   │   └── use-theme.ts
│   │
│   ├── types/
│   │   ├── banking.ts
│   │   ├── api.ts
│   │   └── index.ts
│   │
│   ├── auth.ts                               # AUTH.JS V5 ENTRY POINT
│   └── proxy.ts                              # NEXT.JS 16 PROXY
│
├── .env.local
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md