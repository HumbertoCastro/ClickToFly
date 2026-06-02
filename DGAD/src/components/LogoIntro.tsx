import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function LogoIntro() {
  const [visible, setVisible] = useState(() => sessionStorage.getItem("dgad-intro-seen") !== "true");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      sessionStorage.setItem("dgad-intro-seen", "true");
      setVisible(false);
    }, reduceMotion ? 120 : 780);

    return () => window.clearTimeout(timeout);
  }, [reduceMotion, visible]);

  if (!visible) {
    return null;
  }

  return (
    <motion.div
      className="logo-intro"
      initial={{ opacity: 1 }}
      animate={{ opacity: reduceMotion ? 0 : [1, 1, 0] }}
      transition={{ duration: reduceMotion ? 0.12 : 0.72, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <motion.div
        className="logo-intro__mark"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: reduceMotion ? 0.08 : 0.42, ease: "easeOut" }}
      >
        <span>DGΔD</span>
        <small>Disciplina Gera Destino</small>
        <small>LifeForce 360°</small>
      </motion.div>
    </motion.div>
  );
}
