import { useAuthStore } from '@/stores/authStore';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, description, actions }: HeaderProps) {
  const currentUser = useAuthStore((s) => s.currentUser);

  return (
    <header className="flex items-start justify-between gap-4 mb-8">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4L3 9l9 5 9-5-9-5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9v6l9 5 9-5V9"
              />
            </svg>
          </span>

          <h1 className="text-2xl font-bold text-foreground font-display text-balance">
            {title}
          </h1>
        </div>

        {description && (
          <p className="mt-1 text-sm text-muted-foreground text-pretty max-w-2xl">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {actions}
        <div className="flex items-center justify-center size-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          {currentUser?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}