/**
 * Country Landmark Component
 * 
 * Stylized SVG visualization of iconic landmarks
 */

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CountryLandmarkProps {
  landmark: string;
  countryName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showOverlay?: boolean;
  landmarkCity?: string;
}

// Landmark SVG components - stylized minimalist versions
const landmarks: Record<string, React.FC<{ className?: string }>> = {
  'Brandenburg Gate': BrandenburgGate,
  'Eiffel Tower': EiffelTower,
  'Big Ben': BigBen,
  'Statue of Liberty': StatueOfLiberty,
  'Sydney Opera House': SydneyOperaHouse,
  'Mount Fuji': MountFuji,
  'Great Wall of China': GreatWall,
  'Taj Mahal': TajMahal,
  'Christ the Redeemer': ChristRedeemer,
  'Kingdom Centre Tower': KingdomTower,
  'Marina Bay Sands': MarinaBaySands,
  'Wawel Castle': WawelCastle,
  'Hagia Sophia': HagiaSophia,
  'Chichen Itza Pyramid': ChichenItza,
  'Zuma Rock': ZumaRock,
  'Table Mountain': TableMountain,
};

export function CountryLandmark({
  landmark,
  countryName,
  className,
  size = 'md',
  animated = true,
  showOverlay = false,
  landmarkCity,
}: CountryLandmarkProps) {
  const LandmarkComponent = landmarks[landmark];
  
  const sizeClasses = {
    sm: 'h-24',
    md: 'h-40',
    lg: 'h-64',
    xl: 'h-full min-h-[200px]',
  };

  const isXL = size === 'xl';

  if (!LandmarkComponent) {
    return (
      <div className={cn(
        'flex items-center justify-center relative',
        sizeClasses[size],
        className
      )}>
        <div className="text-center">
          <motion.div 
            className={cn('mb-2', isXL ? 'text-6xl' : 'text-4xl')}
            animate={animated ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🏛️
          </motion.div>
          <p className={cn('text-white/30', isXL ? 'text-sm' : 'text-xs')}>{landmark}</p>
        </div>
        {showOverlay && (
          <LandmarkOverlay 
            landmark={landmark} 
            countryName={countryName} 
            landmarkCity={landmarkCity}
          />
        )}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        'relative flex items-end justify-center',
        sizeClasses[size],
        className
      )}
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.5 }}
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className={cn(
            'bg-adl-accent/10 rounded-full blur-3xl',
            isXL ? 'w-64 h-64' : 'w-32 h-32'
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Landmark SVG */}
      <LandmarkComponent className={cn(
        'relative z-10',
        isXL ? 'w-full h-[80%]' : 'w-full h-full'
      )} />

      {/* Overlay with country and landmark info */}
      {showOverlay && (
        <LandmarkOverlay 
          landmark={landmark} 
          countryName={countryName}
          landmarkCity={landmarkCity}
        />
      )}
    </motion.div>
  );
}

/**
 * Overlay component for landmark with country name
 */
function LandmarkOverlay({
  landmark,
  countryName,
  landmarkCity,
}: {
  landmark: string;
  countryName: string;
  landmarkCity?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"
    >
      <div className="text-center">
        <h3 className="text-white font-bold text-lg">{landmark}</h3>
        <p className="text-white/50 text-sm">
          {landmarkCity ? `${landmarkCity}, ` : ''}{countryName}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Full-width landmark card for right panel display
 */
export function LandmarkCard({
  landmark,
  countryName,
  landmarkCity,
  className,
}: {
  landmark: string;
  countryName: string;
  landmarkCity?: string;
  className?: string;
}) {
  return (
    <div className={cn(
      'relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10',
      className
    )}>
      <CountryLandmark
        landmark={landmark}
        countryName={countryName}
        landmarkCity={landmarkCity}
        size="xl"
        showOverlay={true}
        animated={true}
      />
    </div>
  );
}

// Stylized SVG Landmark Components
function BrandenburgGate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 150" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Columns */}
        {[20, 50, 80, 120, 150, 180].map((x, i) => (
          <motion.rect
            key={i}
            x={x - 6}
            y={50}
            width={12}
            height={80}
            fill="currentColor"
            opacity={0.8}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            style={{ transformOrigin: 'bottom' }}
          />
        ))}
        {/* Top beam */}
        <rect x="10" y="40" width="180" height="12" fill="currentColor" opacity={0.9} />
        {/* Quadriga (chariot) */}
        <motion.path
          d="M80 35 L100 15 L120 35"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        />
        <circle cx="100" cy="18" r="8" fill="currentColor" opacity={0.7} />
        {/* Base */}
        <rect x="5" y="130" width="190" height="10" fill="currentColor" opacity={0.5} />
      </motion.g>
    </svg>
  );
}

function EiffelTower({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 150" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Main structure */}
        <motion.path
          d="M50 5 L30 50 L25 80 L15 130 L35 130 L40 100 L50 100 L60 100 L65 130 L85 130 L75 80 L70 50 Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="currentColor"
          fillOpacity={0.3}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5 }}
        />
        {/* Cross beams */}
        <line x1="32" y1="45" x2="68" y2="45" stroke="currentColor" strokeWidth="2" />
        <line x1="28" y1="70" x2="72" y2="70" stroke="currentColor" strokeWidth="2" />
        <line x1="22" y1="100" x2="78" y2="100" stroke="currentColor" strokeWidth="2" />
        {/* Top spire */}
        <line x1="50" y1="5" x2="50" y2="0" stroke="currentColor" strokeWidth="2" />
        {/* Base */}
        <rect x="10" y="130" width="80" height="8" fill="currentColor" opacity={0.5} />
      </motion.g>
    </svg>
  );
}

function BigBen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 150" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Tower body */}
        <rect x="20" y="40" width="40" height="100" fill="currentColor" opacity={0.7} />
        {/* Clock face */}
        <circle cx="40" cy="70" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="40" y1="58" x2="40" y2="70" stroke="currentColor" strokeWidth="2" />
        <line x1="40" y1="70" x2="48" y2="75" stroke="currentColor" strokeWidth="2" />
        {/* Spire */}
        <motion.path
          d="M40 5 L30 40 L50 40 Z"
          fill="currentColor"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ transformOrigin: 'bottom' }}
        />
        {/* Windows */}
        {[90, 110].map((y, i) => (
          <rect key={i} x="30" y={y} width="20" height="8" fill="rgba(0,0,0,0.3)" />
        ))}
        {/* Base */}
        <rect x="15" y="140" width="50" height="8" fill="currentColor" opacity={0.5} />
      </motion.g>
    </svg>
  );
}

function StatueOfLiberty({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 150" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Pedestal */}
        <rect x="25" y="100" width="30" height="40" fill="currentColor" opacity={0.5} />
        {/* Body */}
        <motion.path
          d="M40 100 L35 70 L30 70 L32 50 L40 35 L48 50 L50 70 L45 70 L40 100"
          fill="currentColor"
          opacity={0.7}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ transformOrigin: 'bottom' }}
        />
        {/* Torch arm */}
        <motion.path
          d="M48 50 L55 30 L58 25"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />
        {/* Flame */}
        <motion.ellipse
          cx="58"
          cy="20"
          rx="5"
          ry="8"
          fill="currentColor"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        {/* Crown */}
        <motion.path
          d="M32 35 L30 25 M36 35 L35 23 M40 35 L40 20 M44 35 L45 23 M48 35 L50 25"
          stroke="currentColor"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        />
        {/* Head */}
        <circle cx="40" cy="38" r="6" fill="currentColor" />
      </motion.g>
    </svg>
  );
}

function SydneyOperaHouse({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Sails */}
        {[0, 30, 60, 90].map((offset, i) => (
          <motion.path
            key={i}
            d={`M${50 + offset} 80 Q${60 + offset} 20, ${90 + offset} 80`}
            fill="currentColor"
            opacity={0.7 - i * 0.1}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.2, duration: 0.5 }}
            style={{ transformOrigin: 'bottom' }}
          />
        ))}
        {/* Base platform */}
        <rect x="30" y="80" width="150" height="10" fill="currentColor" opacity={0.4} />
      </motion.g>
    </svg>
  );
}

function MountFuji({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 100" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Mountain */}
        <motion.path
          d="M75 10 L10 90 L140 90 Z"
          fill="currentColor"
          opacity={0.6}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8 }}
          style={{ transformOrigin: 'bottom' }}
        />
        {/* Snow cap */}
        <motion.path
          d="M75 10 L55 35 L60 35 L65 30 L75 35 L85 30 L90 35 L95 35 Z"
          fill="white"
          opacity={0.9}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />
      </motion.g>
    </svg>
  );
}

function GreatWall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Wall sections going up hill */}
        <motion.path
          d="M10 80 L40 60 L80 50 L120 40 L160 35 L190 30"
          stroke="currentColor"
          strokeWidth="15"
          fill="none"
          opacity={0.7}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5 }}
        />
        {/* Towers */}
        {[40, 120].map((x, i) => (
          <motion.rect
            key={i}
            x={x - 10}
            y={i === 0 ? 45 : 25}
            width={20}
            height={30}
            fill="currentColor"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.5 + i * 0.2, duration: 0.3 }}
            style={{ transformOrigin: 'bottom' }}
          />
        ))}
      </motion.g>
    </svg>
  );
}

function TajMahal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 120" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Main dome */}
        <motion.ellipse
          cx="75"
          cy="40"
          rx="30"
          ry="35"
          fill="currentColor"
          opacity={0.7}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: 'bottom' }}
        />
        {/* Spire */}
        <motion.line
          x1="75"
          y1="5"
          x2="75"
          y2="15"
          stroke="currentColor"
          strokeWidth="3"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        />
        {/* Base building */}
        <rect x="35" y="60" width="80" height="50" fill="currentColor" opacity={0.5} />
        {/* Minarets */}
        {[20, 130].map((x, i) => (
          <motion.g key={i}>
            <rect x={x - 5} y={30} width={10} height={80} fill="currentColor" opacity={0.4} />
            <ellipse cx={x} cy={30} rx={6} ry={8} fill="currentColor" opacity={0.5} />
          </motion.g>
        ))}
        {/* Arched entrance */}
        <path d="M65 110 Q75 85 85 110" fill="rgba(0,0,0,0.3)" />
      </motion.g>
    </svg>
  );
}

function ChristRedeemer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 130" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Arms */}
        <motion.line
          x1="10"
          y1="45"
          x2="90"
          y2="45"
          stroke="currentColor"
          strokeWidth="8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
        {/* Body */}
        <motion.path
          d="M45 45 L45 100 L55 100 L55 45"
          fill="currentColor"
          opacity={0.7}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: 'top' }}
        />
        {/* Head */}
        <circle cx="50" cy="35" r="10" fill="currentColor" />
        {/* Robe base */}
        <motion.path
          d="M35 100 L50 120 L65 100"
          fill="currentColor"
          opacity={0.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5 }}
        />
        {/* Pedestal */}
        <rect x="40" y="120" width="20" height="10" fill="currentColor" opacity={0.3} />
      </motion.g>
    </svg>
  );
}

function KingdomTower({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 150" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Main tower */}
        <motion.path
          d="M15 140 L15 30 L30 5 L45 30 L45 140"
          fill="currentColor"
          opacity={0.7}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8 }}
          style={{ transformOrigin: 'bottom' }}
        />
        {/* Sky bridge gap */}
        <motion.path
          d="M20 25 Q30 15 40 25"
          fill="rgba(0,0,0,0.5)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
        {/* Windows */}
        {[50, 70, 90, 110].map((y, i) => (
          <rect key={i} x="22" y={y} width="16" height="6" fill="rgba(0,0,0,0.3)" />
        ))}
      </motion.g>
    </svg>
  );
}

function MarinaBaySands({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 100" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Three towers */}
        {[30, 90, 150].map((x, i) => (
          <motion.path
            key={i}
            d={`M${x - 15} 90 L${x - 12} 30 L${x + 12} 30 L${x + 15} 90`}
            fill="currentColor"
            opacity={0.6}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.2, duration: 0.5 }}
            style={{ transformOrigin: 'bottom' }}
          />
        ))}
        {/* Sky park */}
        <motion.path
          d="M15 28 Q90 15 165 28 L165 35 Q90 22 15 35 Z"
          fill="currentColor"
          opacity={0.8}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        />
      </motion.g>
    </svg>
  );
}

function WawelCastle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 100" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Main building */}
        <rect x="30" y="40" width="120" height="50" fill="currentColor" opacity={0.6} />
        {/* Towers */}
        {[30, 90, 150].map((x, i) => (
          <motion.g key={i}>
            <rect x={x - 12} y={20} width={24} height={70} fill="currentColor" opacity={0.7} />
            <polygon points={`${x - 12},20 ${x},5 ${x + 12},20`} fill="currentColor" opacity={0.8} />
          </motion.g>
        ))}
      </motion.g>
    </svg>
  );
}

function HagiaSophia({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 100" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Main dome */}
        <motion.ellipse
          cx="75"
          cy="40"
          rx="40"
          ry="30"
          fill="currentColor"
          opacity={0.6}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          style={{ transformOrigin: 'bottom' }}
        />
        {/* Base */}
        <rect x="25" y="55" width="100" height="35" fill="currentColor" opacity={0.5} />
        {/* Minarets */}
        {[15, 135].map((x, i) => (
          <motion.g key={i}>
            <rect x={x - 4} y={20} width={8} height={70} fill="currentColor" opacity={0.5} />
            <polygon points={`${x - 4},20 ${x},10 ${x + 4},20`} fill="currentColor" opacity={0.6} />
          </motion.g>
        ))}
      </motion.g>
    </svg>
  );
}

function ChichenItza({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Stepped pyramid */}
        {[0, 1, 2, 3, 4].map((step, i) => (
          <motion.rect
            key={i}
            x={10 + step * 10}
            y={80 - step * 15}
            width={100 - step * 20}
            height={15}
            fill="currentColor"
            opacity={0.7 - i * 0.1}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            style={{ transformOrigin: 'bottom' }}
          />
        ))}
        {/* Temple at top */}
        <rect x="45" y="15" width="30" height={20} fill="currentColor" opacity={0.8} />
      </motion.g>
    </svg>
  );
}

function ZumaRock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 100" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.path
          d="M20 90 Q50 20 75 30 Q100 20 130 90 Z"
          fill="currentColor"
          opacity={0.6}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          style={{ transformOrigin: 'bottom' }}
        />
        {/* Face-like features */}
        <circle cx="60" cy="55" r={8} fill="rgba(0,0,0,0.2)" />
        <circle cx="90" cy={55} r="8" fill="rgba(0,0,0,0.2)" />
      </motion.g>
    </svg>
  );
}

function TableMountain({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 80" className={cn('text-adl-accent', className)} fill="none">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.path
          d="M10 70 L30 30 L50 25 L130 25 L150 30 L170 70 Z"
          fill="currentColor"
          opacity={0.6}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          style={{ transformOrigin: 'bottom' }}
        />
        {/* Flat top */}
        <line x1="50" y1="25" x2="130" y2="25" stroke="currentColor" strokeWidth="4" opacity={0.8} />
      </motion.g>
    </svg>
  );
}

export default CountryLandmark;
