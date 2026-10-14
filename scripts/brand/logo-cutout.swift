import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// usage: cut <in.png> <out.png> <x> <y> <w> <h> <targetHeight> [square]
let a = CommandLine.arguments
let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil)!
let full = CGImageSourceCreateImageAtIndex(src, 0, nil)!
let crop = full.cropping(to: CGRect(x: Int(a[3])!, y: Int(a[4])!, width: Int(a[5])!, height: Int(a[6])!))!
let W = crop.width, H = crop.height
var px = [UInt8](repeating: 0, count: W * H * 4)
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
let ctx = CGContext(data: &px, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4, space: cs,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.draw(crop, in: CGRect(x: 0, y: 0, width: W, height: H))

func minC(_ i: Int) -> Int { Int(min(px[i*4], px[i*4+1], px[i*4+2])) }
let T = 232 // near-white threshold for background
var bg = [Bool](repeating: false, count: W * H)
var stack: [Int] = []
for x in 0..<W { stack.append(x); stack.append((H-1)*W + x) }
for y in 0..<H { stack.append(y*W); stack.append(y*W + W-1) }
while let i = stack.popLast() {
  if bg[i] || minC(i) < T { continue }
  bg[i] = true
  let x = i % W, y = i / W
  if x > 0 { stack.append(i-1) }; if x < W-1 { stack.append(i+1) }
  if y > 0 { stack.append(i-W) }; if y < H-1 { stack.append(i+W) }
}
// Optional: every near-white pixel right of this column is background
// (letter counters such as the inside of "o" are not edge-connected).
if a.count > 9, let textFrom = Int(a[9]) {
  for y in 0..<H { for x in max(0, textFrom - Int(a[3])!)..<W where minC(y*W+x) >= T { bg[y*W+x] = true } }
}
// Optional ERASE="x,y,w,h" (source coordinates): treat that box as background.
if let all = ProcessInfo.processInfo.environment["ERASE"] {
  for e in all.split(separator: ";") {
  let v = e.split(separator: ",").compactMap { Int($0) }
  let cx = Int(a[3])!, cy = Int(a[4])!
  for y in max(0, v[1]-cy)..<min(H, v[1]-cy+v[3]) { for x in max(0, v[0]-cx)..<min(W, v[0]-cx+v[2]) { bg[y*W+x] = true } }
  }
}
// Band of 2 px around the background: un-matte from white (anti-aliased edges).
var band = [Bool](repeating: false, count: W * H)
for y in 0..<H { for x in 0..<W where !bg[y*W+x] {
  var near = false
  for dy in -2...2 { for dx in -2...2 {
    let nx = x+dx, ny = y+dy
    if nx >= 0 && ny >= 0 && nx < W && ny < H && bg[ny*W+nx] { near = true }
  } }
  band[y*W+x] = near
} }
for i in 0..<(W*H) {
  if bg[i] { px[i*4] = 0; px[i*4+1] = 0; px[i*4+2] = 0; px[i*4+3] = 0; continue }
  if band[i] {
    let m = Double(minC(i))
    let alpha = max(0.0, min(1.0, (255.0 - m) / (255.0 - 120.0)))
    if alpha < 1 {
      for c in 0..<3 {
        let v = Double(px[i*4+c])
        // remove white matte, then premultiply
        let un = alpha > 0 ? (v - (1 - alpha) * 255) / alpha : 0
        px[i*4+c] = UInt8(max(0, min(255, un * alpha)))
      }
      px[i*4+3] = UInt8(alpha * 255)
    }
  }
}
// Tight bounding box of visible pixels.
var x0 = W, y0 = H, x1 = 0, y1 = 0
for y in 0..<H { for x in 0..<W where px[(y*W+x)*4+3] > 8 { x0 = min(x0,x); x1 = max(x1,x); y0 = min(y0,y); y1 = max(y1,y) } }
var bw = x1 - x0 + 1, bh = y1 - y0 + 1
let pad = Int(Double(max(bw, bh)) * 0.02)
var ox = x0 - pad, oy = y0 - pad
bw += 2*pad; bh += 2*pad
let square = a.count > 8 && a[8] == "square"
if square { let s = max(bw, bh); ox -= (s - bw)/2; oy -= (s - bh)/2; bw = s; bh = s }
let keyed = ctx.makeImage()!
// CGContext origin is bottom-left; image rows are top-down in the buffer.
let region = CGRect(x: ox, y: oy, width: bw, height: bh)
let canvasW = bw, canvasH = bh
let outCtx = CGContext(data: nil, width: canvasW, height: canvasH, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                       bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
outCtx.draw(keyed, in: CGRect(x: -region.minX, y: -(CGFloat(H) - region.maxY), width: CGFloat(W), height: CGFloat(H)))
let tight = outCtx.makeImage()!
let th = Int(a[7])!
let tw = Int((Double(canvasW) * Double(th) / Double(canvasH)).rounded())
let fin = CGContext(data: nil, width: tw, height: th, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
fin.interpolationQuality = .high
fin.draw(tight, in: CGRect(x: 0, y: 0, width: tw, height: th))
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, fin.makeImage()!, nil)
CGImageDestinationFinalize(dest)
print("\(a[2]): \(tw)x\(th) from crop \(Int(region.width))x\(Int(region.height))")
