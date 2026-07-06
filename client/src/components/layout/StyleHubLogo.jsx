export default function StyleHubLogo({ size = 'md', showText = true }) {
  const sizeMap = {
    sm: { container: 'w-6 h-6', text: 'text-xs' },
    md: { container: 'w-8 h-8', text: 'text-sm' },
    lg: { container: 'w-12 h-12', text: 'text-lg' },
    xl: { container: 'w-16 h-16', text: 'text-2xl' },
  };

  const { container, text } = sizeMap[size];

  return (
    <div className="flex items-center gap-2">
      {/* Logo Icon */}
      <div className={`${container} rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center relative overflow-hidden`}>
        {/* Decorative pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="2" fill="white" />
          </pattern>
          <rect width="100" height="100" fill="url(#dots)" />
        </svg>
        {/* Main icon */}
        <svg className="relative z-10 w-full h-full p-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${text} font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
            StyleHub
          </span>
          <span className="text-[10px] text-gray-500 font-medium">Fashion Store</span>
        </div>
      )}
    </div>
  );
}
