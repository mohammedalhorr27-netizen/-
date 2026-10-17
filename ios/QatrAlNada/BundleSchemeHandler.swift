import Foundation
import WebKit

/// يقدّم ملفات واجهة المشجرة (مجلد docs داخل التطبيق) على العنوان qatr://app/ بدل file://،
/// ليكون للصفحة أصلٌ ثابت يحفظ فيه localStorage التقدّمَ والمحفوظات والإعدادات.
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "qatr"
    static let startURL = URL(string: "\(scheme)://app/index.html")!

    private static let mimeTypes: [String: String] = [
        "html": "text/html; charset=utf-8",
        "css": "text/css; charset=utf-8",
        "js": "text/javascript; charset=utf-8",
        "json": "application/json",
        "webmanifest": "application/manifest+json",
        "txt": "text/plain; charset=utf-8",
        "png": "image/png",
        "svg": "image/svg+xml",
        "ttf": "font/ttf",
        "woff2": "font/woff2",
    ]

    private let root: URL

    init(root: URL) {
        self.root = root.standardizedFileURL
    }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else {
            task.didFailWithError(URLError(.badURL))
            return
        }
        var path = String(url.path.drop(while: { $0 == "/" }))
        if path.isEmpty || path.hasSuffix("/") { path += "index.html" }
        let file = root.appendingPathComponent(path).standardizedFileURL

        // لا يُقرأ شيء خارج مجلد الواجهة
        guard file.path.hasPrefix(root.path + "/"),
              let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
            task.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        let type = Self.mimeTypes[file.pathExtension.lowercased()] ?? "application/octet-stream"
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: [
            "Content-Type": type,
            "Content-Length": String(data.count),
            "Cache-Control": "no-cache",
        ])!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {
        // الاستجابة تُرسل كاملةً في start، فلا يبقى ما يُلغى
    }
}
