import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
// usage: compose <in.png> <out.png> <size> <innerFraction> [white]
let a = CommandLine.arguments
let img = CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil)!, 0, nil)!
let size = Int(a[3])!, inner = Double(a[4])!
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.interpolationQuality = .high
if a.count > 5 && a[5] == "white" { ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: size, height: size)) }
let s = Double(size) * inner, o = (Double(size) - s) / 2
ctx.draw(img, in: CGRect(x: o, y: o, width: s, height: s))
let d = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(d, ctx.makeImage()!, nil); CGImageDestinationFinalize(d)
print("\(a[2]) \(size)x\(size)")
