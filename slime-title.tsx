import {HERO_ABILITIES} from "./hero-abilities";
/** Original vector lettering inspired by the supplied reference; no background image. */
export function SlimeTitle(){
 return <svg viewBox="70 175 1060 420" role="img" aria-labelledby="slime-title-label" style={{width:"min(900px,94vw)",height:"auto",display:"block",margin:"0 auto"}}>
  <title id="slime-title-label">Gravewick Mayhem</title>
   <defs>
    <linearGradient id="slime" x2="0.2" y2="1"><stop stopColor="#e2f05c"/><stop offset=".18" stopColor={HERO_ABILITIES[1].color}/><stop offset=".5" stopColor="#5f6e10"/><stop offset=".72" stopColor={HERO_ABILITIES[1].color}/><stop offset="1" stopColor="#5f6e10"/></linearGradient>
    <linearGradient id="blood" x2="0.15" y2="1"><stop stopColor="#ad8b77"/><stop offset=".2" stopColor="#713d3b"/><stop offset=".55" stopColor="#301d21"/><stop offset=".7" stopColor="#59406e"/><stop offset=".87" stopColor={HERO_ABILITIES[0].color}/><stop offset="1" stopColor="#6d4cb8"/></linearGradient>
    <filter id="letter-depth" x="-20%" y="-30%" width="150%" height="180%">
     <feDropShadow dx="7" dy="11" stdDeviation="2" floodColor="#010604" floodOpacity="1"/>
     <feTurbulence type="fractalNoise" baseFrequency=".045 .11" numOctaves="3" seed="13" result="grain"/>
     <feComposite in="grain" in2="SourceAlpha" operator="in" result="surface"/>
     <feBlend in="SourceGraphic" in2="surface" mode="soft-light"/>
     <feSpecularLighting in="surface" surfaceScale="3" specularConstant=".6" specularExponent="16" lightingColor="#e0e7b9" result="shine"><feDistantLight azimuth="230" elevation="55"/></feSpecularLighting>
     <feComposite in="shine" in2="SourceAlpha" operator="in" result="shine-clipped"/>
     <feBlend in="SourceGraphic" in2="shine-clipped" mode="screen"/>
    </filter>
   </defs>
   <g className="slime-title" fontFamily="Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" fontWeight="900" textAnchor="middle" strokeLinejoin="round" filter="url(#letter-depth)">
    <text x="609" y="346" fontSize="158" textLength="980" lengthAdjust="spacingAndGlyphs" fill="#101a13" stroke="#101a13" strokeWidth="9">GRAVEWICK</text>
    <text x="600" y="335" fontSize="158" textLength="980" lengthAdjust="spacingAndGlyphs" fill="url(#slime)" stroke="#d1df67" strokeWidth="1.5">GRAVEWICK</text>
    <text x="609" y="506" fontSize="166" textLength="840" lengthAdjust="spacingAndGlyphs" fill="#070f0b" stroke="#070f0b" strokeWidth="10">MAYHEM</text>
    <text x="600" y="495" fontSize="166" textLength="840" lengthAdjust="spacingAndGlyphs" fill="url(#blood)" stroke="#a283b8" strokeWidth="1.4">MAYHEM</text>
    <g fill="url(#slime)" stroke="#8d9e25" strokeWidth="1">
     {[145,224,365,510,695,843,958,1056].map((x,i)=><path key={x} d={`M${x} 325q-4 20 0 ${30+i%3*15}q6 10 11 0v-${24+i%3*15}q2-12 6-17z`}/>)}
    </g>
    <g fill="#6d4cb8" stroke="#a283e8" strokeWidth="1">
     {[255,420,570,745,885].map((x,i)=><path key={x} d={`M${x} 486q-5 20 0 ${48+i%2*25}q6 15 12 0v-${40+i%2*25}q1-12 5-16z`}/>)}
    </g>
   </g>

 </svg>;
}
