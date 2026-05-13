"use client";

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

export function UserAvatar({ firstName, lastName, avatar, size = "sm" }: UserAvatarProps) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  const sizeClass = sizes[size];

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClass} rounded-full object-cover border-2 border-primary/20`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-primary flex items-center justify-center font-bold text-white`}>
      {initials}
    </div>
  );
}
