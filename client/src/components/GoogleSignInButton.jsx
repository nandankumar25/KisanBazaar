import React, { useEffect, useRef, useState } from 'react';

const GoogleSignInButton = ({ onSuccess, onError, text = 'continue_with' }) => {
  const buttonRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '79856565875-dreq830u8qvk7r20uh6gv4dphnjn0c2n.apps.googleusercontent.com';

  useEffect(() => {
    if (!clientId) return;

    let isMounted = true;

    const initAndRender = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onSuccess?.(response.credential);
            } else {
              onError?.('No credential returned from Google Sign-In.');
            }
          },
        });

        buttonRef.current.innerHTML = '';

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 360,
          shape: 'rectangular',
          text: text,
          logo_alignment: 'left',
        });

        if (isMounted) {
          setIsRendered(true);
        }
        return true;
      } catch (err) {
        console.warn('Google Sign-In initialization failed:', err);
        return false;
      }
    };

    // 1. Ensure Google Identity Services script is loaded
    if (!document.getElementById('google-gsi-client')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(initAndRender, 100);
      };
      document.head.appendChild(script);
    }

    // 2. Try initializing immediately if script is already present
    if (initAndRender()) {
      return () => {
        isMounted = false;
      };
    }

    // 3. Poll briefly for script availability
    const interval = setInterval(() => {
      if (initAndRender()) {
        clearInterval(interval);
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [clientId, onSuccess, onError, text]);

  const handleFallbackClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      onError?.('Google Sign-In is still loading. Please check your connection or try again in a moment.');
    }
  };

  const getButtonText = () => {
    if (text === 'signup_with') return 'Sign up with Google';
    if (text === 'signin_with') return 'Sign in with Google';
    return 'Continue with Google';
  };

  return (
    <div className="w-full flex flex-col items-center justify-center my-2">
      {/* Container for Google's official rendered button */}
      <div
        ref={buttonRef}
        className={`w-full flex justify-center transition-opacity duration-200 ${
          isRendered ? 'block opacity-100' : 'hidden opacity-0'
        }`}
      />

      {/* Styled fallback button rendered until Google's iframe loads or if delayed */}
      {!isRendered && (
        <button
          type="button"
          onClick={handleFallbackClick}
          className="w-full max-w-[360px] h-[42px] px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center gap-3 transition shadow-sm text-sm font-semibold text-slate-700"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{getButtonText()}</span>
        </button>
      )}
    </div>
  );
};

export default GoogleSignInButton;
