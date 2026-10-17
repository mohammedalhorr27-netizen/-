import UIKit
import WebKit

/// شاشة واحدة تعرض واجهة المشجرة (docs/) من ملفات التطبيق دون حاجة للإنترنت.
final class WebViewController: UIViewController {
    private static let paper = UIColor(red: 0xF2 / 255, green: 0xE8 / 255, blue: 0xD2 / 255, alpha: 1)
    private static let ink = UIColor(red: 0x0C / 255, green: 0x15 / 255, blue: 0x13 / 255, alpha: 1)

    private var webView: WKWebView!

    /// وضع الصفحة كما تبلّغ عنه، وقد يخالف وضع النظام إن اختاره القارئ من داخل التطبيق
    private var pageIsDark: Bool?

    override var preferredStatusBarStyle: UIStatusBarStyle {
        guard let dark = pageIsDark else { return .default }
        return dark ? .lightContent : .darkContent
    }

    override func loadView() {
        let config = WKWebViewConfiguration()
        let root = Bundle.main.url(forResource: "docs", withExtension: nil)!
        config.setURLSchemeHandler(BundleSchemeHandler(root: root), forURLScheme: BundleSchemeHandler.scheme)
        config.userContentController.add(WeakScriptHandler(self), name: "theme")
        // تكبير الصفحة بإصبعين لا يناسب تطبيقًا، وللخط زرّ تكبير خاص في الواجهة
        config.userContentController.addUserScript(WKUserScript(
            source: "var m = document.querySelector('meta[name=viewport]'); if (m) m.content += ', maximum-scale=1, user-scalable=no';",
            injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        #if DEBUG
        config.userContentController.add(WeakScriptHandler(self), name: "log")
        config.userContentController.addUserScript(WKUserScript(
            source: "addEventListener('error', function (e) { webkit.messageHandlers.log.postMessage('JS error: ' + e.message + ' @ ' + e.filename + ':' + e.lineno); });",
            injectionTime: .atDocumentStart, forMainFrameOnly: true))
        #endif

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.allowsLinkPreview = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        // الصفحة تبتعد بنفسها عن شريط الحالة ومؤشر الشاشة الرئيسية عبر env(safe-area-inset-*)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        #if DEBUG
        webView.isInspectable = true
        #endif

        let container = UIView()
        webView.frame = container.bounds
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        container.addSubview(webView)
        view = container
        applyTheme()
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        webView.load(URLRequest(url: BundleSchemeHandler.startURL))
    }

    private func applyTheme() {
        if let dark = pageIsDark {
            view.backgroundColor = dark ? Self.ink : Self.paper
        } else {
            view.backgroundColor = UIColor { $0.userInterfaceStyle == .dark ? Self.ink : Self.paper }
        }
        setNeedsStatusBarAppearanceUpdate()
    }
}

extension WebViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "theme":
            guard let dark = message.body as? Bool else { return }
            pageIsDark = dark
            applyTheme()
        default:
            NSLog("QATR %@", String(describing: message.body))
        }
    }
}

extension WebViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        if url.scheme == BundleSchemeHandler.scheme {
            decisionHandler(.allow)
            return
        }
        // أي رابط خارجي يُفتح في Safari لا داخل التطبيق
        if ["http", "https", "mailto"].contains(url.scheme ?? "") {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        // قد يُغلق النظام عملية الصفحة في الخلفية لتوفير الذاكرة، فنعيد تحميلها بدل شاشة فارغة
        webView.reload()
    }

    #if DEBUG
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("(window.QATR ? QATR.length : 0) + ' chapters, ' + document.title") { result, error in
            let text = error.map { String(describing: $0) } ?? String(describing: result ?? "nil")
            NSLog("QATR loaded: %@", text)
        }
    }
    #endif
}

/// يمنع الدورة بين WKUserContentController (الذي يحتفظ بمعالجه بقوة) وبين الشاشة.
private final class WeakScriptHandler: NSObject, WKScriptMessageHandler {
    private weak var target: WKScriptMessageHandler?

    init(_ target: WKScriptMessageHandler) {
        self.target = target
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(userContentController, didReceive: message)
    }
}
