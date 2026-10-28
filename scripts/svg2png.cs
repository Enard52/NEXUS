// Minimal SVG→PNG rasterizer for verifying the NEXUS N logo geometry.
// Usage: svg2png <in.svg> <out.png> <size>
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Xml;

class SvgRender {
  static float Scale;
  public static void Main(string[] args){
    if(args.Length<3){Console.Error.WriteLine("usage: svg2png <in.svg> <out.png> <size>");return;}
    string svgPath=args[0], outPath=args[1];
    int size=int.Parse(args[2]);
    Scale=size/512f;
    var doc=new XmlDocument(); doc.Load(svgPath);
    var bmp=new Bitmap(size,size);
    using(var g=Graphics.FromImage(bmp)){
      g.SmoothingMode=SmoothingMode.AntiAlias;
      g.Clear(Color.Transparent);
      foreach(XmlNode n in doc.DocumentElement.ChildNodes){
        if(n.Name=="rect") DrawRect(g,n);
        else if(n.Name=="polygon") DrawPoly(g,n);
      }
    }
    bmp.Save(outPath);
    Console.WriteLine("wrote "+outPath);
  }
  static string Att(XmlNode n,string a){var v=n.Attributes[a];return v==null?"":v.Value;}
  static Color Hex(string h){int v=int.Parse(h.Replace("#",""),System.Globalization.NumberStyles.HexNumber,System.Globalization.CultureInfo.InvariantCulture);return Color.FromArgb(v|unchecked((int)0xFF000000));}
  static float F(string s){
    if(s=="")return 0;
    // Force invariant parsing regardless of system locale (tr-TR uses comma).
    return float.Parse(s.Replace(",","."),System.Globalization.CultureInfo.InvariantCulture);
  }
  static void DrawRect(Graphics g,XmlNode n){
    float x=F(Att(n,"x"))*Scale;
    float y=F(Att(n,"y"))*Scale;
    float w=F(Att(n,"width"))*Scale;
    float h=F(Att(n,"height"))*Scale;
    float r=F(Att(n,"rx"))*Scale;
    var path=new GraphicsPath();
    float W=w,H=h,X=x,Y=y,R=r;
    if(R>0){
      path.AddArc(X,Y,2*R,2*R,180,90);
      path.AddArc(X+W-2*R,Y,2*R,2*R,270,90);
      path.AddArc(X+W-2*R,Y+H-2*R,2*R,2*R,0,90);
      path.AddArc(X,Y+H-2*R,2*R,2*R,90,90);
      path.CloseFigure();
    } else path.AddRectangle(new RectangleF(X,Y,W,H));
    using(var b=new SolidBrush(Hex(Att(n,"fill")))) g.FillPath(b,path);
  }
  static void DrawPoly(Graphics g,XmlNode n){
    string pts=Att(n,"points");
    var parts=pts.Split(new[]{" "},StringSplitOptions.RemoveEmptyEntries);
    var p=new System.Collections.Generic.List<PointF>();
    foreach(var pr in parts){var xy=pr.Split(',');p.Add(new PointF(F(xy[0])*Scale,F(xy[1])*Scale));}
    using(var b=new SolidBrush(Hex(Att(n,"fill")))) g.FillPolygon(b,p.ToArray());
  }
}
