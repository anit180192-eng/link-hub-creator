declare global { interface Window { Paddle?: any } }
let loading: Promise<any> | null = null;

/** Loads Paddle.js v2 once and initializes it. With ?_ptxn= in the URL, Paddle.js opens that transaction's checkout itself. */
export function loadPaddle(environment: string, token: string, eventCallback?: (e: any) => void) {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.async = true;
    s.onload = () => {
      if (environment === "sandbox") window.Paddle.Environment.set("sandbox");
      window.Paddle.Initialize({ token, ...(eventCallback ? { eventCallback } : {}) });
      resolve(window.Paddle);
    };
    s.onerror = () => { loading = null; reject(new Error("Couldn't load checkout")); };
    document.head.appendChild(s);
  });
  return loading;
}
