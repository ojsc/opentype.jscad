Wrapper opentypejs for openjscad
early version

usage:
```javascript
include("https://raw.githubusercontent.com/ojsc/opentype.jscad/master/dist/opentype.min.jscad");
include("https://raw.githubusercontent.com/ojsc/opentype.jscad/master/dist/fonts/purisa_ttf.jscad");
include("https://raw.githubusercontent.com/ojsc/opentype.jscad/master/dist/fonts/mainframe_spore_ttf.jscad");
include("https://raw.githubusercontent.com/ojsc/opentype.jscad/master/dist/fonts/emojisymbols_regular_woff.jscad");

function main () {
  let fPurisa = Font3D.parse(purisa_ttf_data.buffer);
  let cagPurisa = Font3D.cagFromString(fPurisa, "Hello", 14);
  let csgPurisa = linear_extrude({ height: 5 }, cagPurisa[0].union(cagPurisa));
  csgPurisa = csgPurisa.center().translate([0,20,0]);
  csgPurisa = color("orange", csgPurisa);
  
  let fMainframe = Font3D.parse(mainframe_spore_ttf_data.buffer);
  let cagMainframe = Font3D.cagFromString(fMainframe, "World", 14);
  let csgMainframe = linear_extrude({ height: 5 }, cagMainframe[0].union(cagMainframe));
  csgMainframe = csgMainframe.center();
  
  let fEmoji = Font3D.parse(emojisymbols_regular_woff_data.buffer);
  
  csgFox = drawGlyph(fEmoji, 262, 24, 3).translate([0,-20,0]);
  csgFox = color("lime", csgFox);
  csgMonkey = drawGlyph(fEmoji, 222, 24, 3).translate([-20,-20,0]);
  csgMonkey = color("red", csgMonkey);
  csgParty = drawGlyph(fEmoji, 134, 24, 3).translate([20,-20,0]);
  csgParty = color("blue", csgParty)
  

  return [csgPurisa, csgMainframe, csgFox, csgMonkey, csgParty];
}

function drawGlyph(font, number,size,height) {
  let cagFox = Font3D.cagFromGlyph(font,number,size);
  return linear_extrude({ height:height}, cagFox).center();
}
```
