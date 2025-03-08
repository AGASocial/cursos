import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { enrollUserInCourses } from '../../lib/users';

export const Return = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const { user } = useAuth();

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');

    if (!sessionId) {
      setStatus('error');
      setError('No session ID found in the URL');
      setLoading(false);
      return;
    }

    // If success parameter is false, don't check status
    if (success === 'false' || success === 'canceled') {
      setStatus('canceled');
      setLoading(false);
      return;
    }

    console.log(`Checking session status for: ${sessionId}`);
    
    fetch(`${import.meta.env.VITE_API_URL}/Payments/session-status?session_id=${sessionId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch session status: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Session status data:', data);
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
        
        // If payment is complete and we have a user, enroll them in the courses
        if (data.status === 'complete' && user) {
          // Get course IDs from session metadata - now it's already an array
          let courseIds = data.metadata?.courseIds;
          
          // If no course IDs in metadata, try to get from localStorage as fallback
          if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
            console.log('No valid course IDs in session metadata, trying localStorage');
            const courseIdsString = localStorage.getItem('purchasedCourseIds');
            if (courseIdsString) {
              try {
                courseIds = JSON.parse(courseIdsString);
              } catch (error) {
                console.error('Error parsing course IDs from localStorage:', error);
                setEnrollmentStatus('error');
                setError('Failed to parse course IDs from localStorage');
                return;
              }
            }
          }
          
          if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
            console.log('Course IDs for enrollment:', courseIds);
            
            // Enroll the user in the courses - handle as a separate Promise
            enrollUserInCourses(user.uid, courseIds)
              .then((enrollResult) => {
                console.log('Enrollment result:', enrollResult);
                if (enrollResult.success) {
                  setEnrollmentStatus('success');
                  // Clear the stored course IDs from localStorage
                  localStorage.removeItem('purchasedCourseIds');
                } else {
                  setEnrollmentStatus('error');
                  setError(`Enrollment error: ${enrollResult.error}`);
                }
              })
              .catch((enrollError) => {
                console.error('Error enrolling user in courses:', enrollError);
                setEnrollmentStatus('error');
                setError(enrollError instanceof Error ? enrollError.message : 'Failed to enroll in courses');
              });
          } else {
            console.warn('No course IDs found in session metadata');
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching session status:', error);
        setStatus('error');
        setError(error.message || 'Failed to check payment status');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-gray-600">Verificando su pago...</p>
      </div>
    );
  }

  if (status === 'open') {
    return <Navigate to="/checkout" />;
  }

  if (status === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">¡Pago Exitoso!</h1>
            <p className="text-gray-600 mb-4 text-center">
              ¡Gracias por su compra! Se enviará un correo electrónico de confirmación a {customerEmail}.
            </p>
            {enrollmentStatus === 'success' && (
              <p className="text-green-600 mb-4 text-center font-semibold">
                ¡Ha sido inscrito exitosamente en el/los curso(s)!
              </p>
            )}
            {enrollmentStatus === 'error' && (
              <p className="text-yellow-600 mb-4 text-center">
                El pago fue exitoso, pero encontramos un problema al inscribirle en el/los curso(s).
                Por favor, contacte con soporte con los detalles de su pedido.
              </p>
            )}
            <p className="text-gray-600 text-center mb-8">
              Si tiene alguna pregunta, por favor envíe un correo electrónico a{' '}
              <a 
                href="mailto:soporte-cursos@aga.social" 
                className="text-blue-600 hover:text-blue-800"
              >
                soporte-cursos@aga.social
              </a>
            </p>
            <div className="flex justify-center">
              <Link to="/courses">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a los Cursos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'canceled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-center mb-6">
              <AlertCircle className="w-16 h-16 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Pago Cancelado</h1>
            <p className="text-gray-600 mb-8 text-center">
              Su pago fue cancelado. No se realizaron cargos.
            </p>
            <div className="flex justify-center">
              <Link to="/checkout">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Carrito
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4 text-center">Error de Pago</h1>
          <p className="text-gray-600 mb-4 text-center">
            Hubo un error al procesar su pago. Por favor, inténtelo de nuevo o contacte con soporte.
          </p>
          {error && (
            <p className="text-sm text-red-500 mb-8 text-center">
              Detalles del error: {error}
            </p>
          )}
          <div className="flex justify-center">
            <Link to="/checkout">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Carrito
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
