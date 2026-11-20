import {expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {SlimeTitle} from "./slime-title";
it("renders only accessible, textured dripping title lettering, not a background scene or new loading controls",()=>{
 const html=renderToStaticMarkup(<SlimeTitle/>);
 expect(html).toContain("GRAVEWICK");expect(html).toContain("MAYHEM");expect(html).toContain("Gravewick Mayhem</title>");
 expect(html).toContain("feSpecularLighting");expect(html).toContain('fill="url(#slime)"');
 expect(html).not.toContain("workshop");expect(html).not.toContain("progressbar");expect(html).not.toContain("<image");
});
