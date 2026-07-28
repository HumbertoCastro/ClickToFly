export function LibraryBackdrop({
  variant = "picker",
}: {
  variant?: "picker" | "app";
}) {
  return (
    <svg
      className={`library-backdrop library-backdrop--${variant}`}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g className="library-backdrop__architecture">
        <path d="M935 132c0-54 44-98 98-98h255c54 0 98 44 98 98v618H935V132Z" />
        <path d="M993 204h337M993 380h337M993 556h337M993 732h337" />
        <path d="M1045 204v-91h42v91M1100 204v-118h58v118M1172 204v-74h34v74M1222 204V98h65v106" />
        <path d="M1013 380V263h49v117M1078 380v-88h33v88M1127 380V247h72v133M1215 380v-104h45v104M1274 380v-72h32v72" />
        <path d="M1015 556V446h65v110M1095 556v-76h40v76M1150 556V432h48v124M1213 556v-96h70v96" />
        <path d="M1008 732V620h44v112M1068 732V597h76v135M1160 732v-95h38v95M1214 732V610h50v122M1278 732v-82h30v82" />
      </g>

      <g className="library-backdrop__reading-nook">
        <path d="M40 748h870" />
        <path d="M113 748V435h562v313" />
        <path d="M113 516h562M113 625h562" />
        <path d="M153 516v-58h54v58M221 516v-82h38v82M275 516v-48h68v48M357 516v-73h47v73M419 516v-55h29v55M465 516v-91h64v91M545 516v-62h46v62M606 516v-80h31v80" />
        <path d="M145 625v-70h35v70M195 625v-87h62v87M272 625v-58h41v58M328 625v-81h29v81M373 625v-65h75v65M464 625v-91h44v91M523 625v-61h49v61M587 625v-82h55v82" />
        <path d="M154 748v-77h55v77M226 748V651h36v97M279 748v-65h73v65M368 748V646h45v102M429 748v-78h31v78M476 748V639h67v109M560 748v-72h42v72M618 748v-96h27v96" />
        <path d="M738 748v-214M697 534h82M712 534l26-70h26l15 70" />
        <path d="M768 748c0-66 53-119 119-119h21v119H768Z" />
        <path d="M805 629c8-49 31-75 69-84" />
        <circle cx="881" cy="538" r="14" />
      </g>

      <g className="library-backdrop__details">
        <path d="M78 270c0-74 60-134 134-134s134 60 134 134v122H78V270Z" />
        <path d="M212 136v256M78 281h268" />
        <path d="M391 374c40-33 83-50 129-50 47 0 92 17 135 50" />
        <path d="M523 322v-88M477 234h92" />
        <circle cx="523" cy="195" r="15" />
      </g>
    </svg>
  );
}
