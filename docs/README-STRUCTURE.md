# Cấu trúc thư mục Nuxt 4

## Tổng quan

Dự án này sử dụng cấu trúc thư mục chuẩn của Nuxt 4. Trong Nuxt 4, tất cả các thư mục liên quan đến client-side code đều nằm trong thư mục `app/`.

## Cấu trúc thư mục

```
conference/
├── app/                    # Client-side code (Nuxt 4)
│   ├── app.vue            # Root component
│   ├── components/         # Vue components
│   ├── composables/        # Composition functions
│   ├── layouts/           # Layout templates
│   ├── middleware/        # Route middleware
│   ├── pages/             # File-based routing
│   ├── plugins/           # Plugins
│   ├── stores/            # State management (Pinia)
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── server/                # Server-side code
│   ├── api/               # API routes
│   ├── entities/          # TypeORM entities
│   ├── utils/             # Server utilities (database, helpers)
│   ├── middleware/        # Server middleware
│   ├── plugins/           # Server plugins
│   └── utils/             # Server utilities
├── assets/                # Assets cần build
├── public/                # Static files
└── docs/                  # Documentation
```

## Thư mục chi tiết

### 📁 `app/` - Client-side Code
Tất cả code phía client trong Nuxt 4 đều nằm trong thư mục này.

#### `app/app.vue`
- Root component của ứng dụng
- Entry point của ứng dụng

#### `app/components/`
- Các Vue components có thể tái sử dụng
- Auto-imported trong Nuxt 4
- Ví dụ: `app/components/Button.vue` → sử dụng `<Button />`

#### `app/layouts/`
- Layout templates cho các trang
- Ví dụ: `app/layouts/default.vue`, `app/layouts/admin.vue`
- Sử dụng: `definePageMeta({ layout: 'admin' })`

#### `app/pages/`
- File-based routing
- Mỗi file `.vue` tạo một route
- Ví dụ: `app/pages/about.vue` → `/about`

#### `app/composables/`
- Reusable composition functions
- Auto-imported trong Nuxt 4
- Ví dụ: `app/composables/useAuth.ts` → `useAuth()`

#### `app/utils/`
- Utility functions và helpers
- Không auto-imported, cần import thủ công
- Ví dụ: `import { formatDate } from '~/app/utils/helpers'`

#### `app/middleware/`
- Route middleware
- Chạy trước khi render page
- Ví dụ: `app/middleware/auth.ts` → `definePageMeta({ middleware: 'auth' })`

#### `app/plugins/`
- Plugins chạy khi khởi động app
- Client-side: `app/plugins/xxx.client.ts`
- Server-side: `app/plugins/xxx.server.ts` (không khuyến khích, dùng `server/plugins/`)
- Universal: `app/plugins/xxx.ts`

#### `app/stores/`
- State management (Pinia)
- Ví dụ: `app/stores/user.ts`

#### `app/types/`
- TypeScript type definitions
- Global types và interfaces

### 📁 `server/` - Server-side Code
Code chạy trên server, không được gửi đến client.

#### `server/api/`
- API routes (Nitro)
- Ví dụ: `server/api/users.get.ts` → `GET /api/users`

#### `server/entities/`
- TypeORM entities
- Định nghĩa database schema

#### `server/utils/`
- Database utilities (`database.ts`, `data-source.ts`)
- Helper functions
- SQL schema script (`schema.sql`)

#### `server/middleware/`
- Server middleware
- Chạy trước mỗi request

#### `server/plugins/`
- Server-side plugins
- Khởi tạo services, database connections, etc.

#### `server/utils/`
- Server utilities
- Database helpers, etc.

### 📁 `assets/`
- Assets cần build (CSS, images, fonts)
- `assets/css/main.css` - TailwindCSS

### 📁 `public/`
- Static files (không build)
- Ví dụ: `public/favicon.ico` → `/favicon.ico`

### 📁 `docs/`
- Documentation
- Tài liệu dự án

## Cách sử dụng

### Components
```vue
<!-- Auto-imported -->
<Button />
<Card />
```

### Composables
```vue
<script setup>
const { message } = useExample()
</script>
```

### Pages
```
pages/
  index.vue          → /
  about.vue          → /about
  users/
    [id].vue         → /users/:id
```

### API Routes
```
server/api/
  hello.get.ts       → GET /api/hello
  users.post.ts      → POST /api/users
```

## Tài liệu tham khảo

- [Nuxt 4 Documentation](https://nuxt.com/docs)
- [PrimeVue Documentation](https://primevue.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
