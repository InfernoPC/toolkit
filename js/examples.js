// Sample inputs shown in the "輸入範例" overlay, keyed by tool id.
// Order within each array doesn't matter; overlay renders tools in INPUT_TOOLS order.
export default {
  'base64-encode': ['Hello, 世界!'],
  'base64-decode': ['SGVsbG8sIOS4lueVjCE='],
  'url-encode': ['https://example.com/搜尋?q=你好 世界'],
  'url-decode': ['https%3A%2F%2Fexample.com%2F%E6%90%9C%E5%B0%8B%3Fq%3D%E4%BD%A0%E5%A5%BD'],
  hash: ['hello world'],
  'json-format': ['{"name":"Tim","tags":["a","b"],"active":true}'],
  'json-unescape': ['{\\"name\\":\\"Tim\\",\\"age\\":30}'],
  'jwt-decode': [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  ],
  'unix-timestamp': ['1700000000', '2024-01-01 12:00:00'],
  'number-base': ['0xFF', '255', '0b1010'],
  'color-convert': ['#4287f5', 'rgb(66, 135, 245)'],
  'html-entity': ['<div class="test">Tom &amp; Jerry</div>'],
  'case-convert': ['helloWorldExample', 'hello_world_example'],
  'qr-code': ['https://example.com'],
  'image-base64': ['貼上圖片（Ctrl+V）或貼上 data:image/... 開頭的 Base64 字串'],
  calculator: ['(12 + 8) * 3 / 4'],
  'text-stats': ['這是一段中英文混合的範例文字 example text 123'],
  cron: ['*/5 * * * *', '0 9 * * 1-5'],
  'ip-cidr': ['192.168.1.10/24'],
  'markdown-preview': ['# 標題\n**粗體** 與 [連結](https://example.com)'],
  'password-generator': ['16'],
  'currency-convert': ['100 usd', '¥1234', 'NT$500'],
};
