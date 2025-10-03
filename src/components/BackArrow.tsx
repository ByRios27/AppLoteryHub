
      'use client';
      // src/components/BackArrow.tsx
      import { useRouter } from 'next/navigation';
      import { FaArrowLeft } from 'react-icons/fa';

      interface BackArrowProps {
        redirectTo?: string; // Ruta de redirección, default '/dashboard'
      }

      const BackArrow: React.FC<BackArrowProps> = ({ redirectTo = '/dashboard' }) => {
        const router = useRouter();

        const handleClick = () => {
          router.push(redirectTo);
        };

        return (
          <button
            onClick={handleClick}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <FaArrowLeft />
            <span>Regresar</span>
          </button>
        );
      };

      export default BackArrow;
      