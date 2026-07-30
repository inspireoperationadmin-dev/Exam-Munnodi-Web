import { useNavigate } from 'react-router-dom';
import { theme } from '../../theme/theme';

interface ProfileAvatarProps {
  name?: string | null;
  email?: string | null;
}

export function ProfileAvatar({ name, email }: ProfileAvatarProps) {
  const navigate = useNavigate();
  const label = name?.trim() || email?.trim() || 'Student';

  return (
    <button
      aria-label={label}
      className={theme.avatar.button}
      onClick={() => navigate('/profile')}
      title={label}
      type="button"
    >
      <span className="relative block h-5 w-5" aria-hidden="true">
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-white" />
        <span className="absolute bottom-0 left-1/2 h-2.5 w-4 -translate-x-1/2 rounded-t-full border-2 border-white border-b-0" />
      </span>
    </button>
  );
}
