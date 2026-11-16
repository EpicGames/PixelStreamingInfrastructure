像素流 (Pixel Streaming) 内网 / 离线部署说明 (兼容 UE 5.3 ~ 5.8+)
======================================================================

一、为什么以前必须开 VPN / 连外网
----------------------------------------------------------------------
Epic 自带的 SignallingWebServer\platform_scripts\cmd\start.bat 启动时会:
  1. 第一次运行时从外网下载 Node.js 和 coturn, 再执行 npm install;
  2. 访问 api.ipify.org 查询"公网 IP";
  3. 用查到的 IP 拼出 TURN 地址, 连同 Google 的 STUN 服务器一起下发给浏览器和 UE;
  4. 网页 HTML 默认从 fonts.googleapis.com 加载字体。
在国内网络或内网无 VPN 时:
  - 第 2 步查不到 IP, TURN 地址被拼成 "turn::19303" 这种非法地址, 浏览器拒绝建立 WebRTC 连接;
  - 第 4 步访问不了 Google Fonts, 网页白屏卡住直到连接超时。

同一内网里浏览器和 UE 能直接互通, 根本用不到公网 IP、STUN 和 TURN。本目录的
脚本自带便携 Node 和编译好的服务器, 已移除所有外链字体与公网依赖, 启动时不访问
任何外网地址, 也不需要 VPN。


二、现场使用(内网电脑)
----------------------------------------------------------------------
  1. 把整个打包目录拷到电脑上(本目录在包里的位置: <项目名>\Samples\PixelStreaming2
     或 <项目名>\Samples\PixelStreaming)。不用安装 Node, 不用联网。
  2. 双击 Start-PixelStreaming.bat
     - 启动信令服务器, 再启动 UE 程序。UE 和平时双击运行一样正常显示,
       本机屏幕上的画面就是网页里的画面(同步), 本机和网页都能操作。
     - 不要最小化 UE 窗口, 最小化后网页画面会停住。
       不需要本机显示时, 把 PixelStreaming.ini 的 WindowMode 改成 offscreen。
     - 信令服务器窗口里会显示访问地址, 例如 http://192.168.1.40/
     - 同时开启 UE 规范健康检查接口: http://127.0.0.1/api/status
  3. 其他电脑 / Pad 用浏览器(Chrome / Edge / Safari)打开这个地址, 点一下画面开始播放。
     鼠标直接点 UE 里的按钮即可; Pad 上单指点按就是鼠标点击。
     UE 加载需要一点时间, 刚启动时没画面就等半分钟再刷新。
  4. 停止: 关闭信令服务器窗口(会同时关闭 UE), 或双击 Stop-PixelStreaming.bat。

  每台新电脑第一次使用(或者移动了目录、改了端口)时:
  右键 Open-Firewall.bat -> "以管理员身份运行", 放行 Windows 防火墙。
  不做这一步, 其他电脑可能打不开网页, 或者网页打开了没有画面。


三、文件说明
----------------------------------------------------------------------
  Start-PixelStreaming.bat    一键启动: 信令服务器 + UE 程序 (Linux: .sh)
  Start-SignallingServer.bat  只启动信令服务器(UE 手动启动或在别的电脑上时用)
  Stop-PixelStreaming.bat     停止信令服务器、TURN、UE 程序
  Check-PixelStreaming.bat    自检与健康检查: 运行时完整性、无外链字体、网卡、端口、/api/status
  Open-Firewall.bat           添加防火墙放行规则(管理员运行)
  PixelStreaming.ini          设置: 端口、REST API、UE 窗口模式、分辨率、TURN 等
  Logs\                       日志
  Offline\                    便携 Node、多版本启动器与健康检查脚本、coturn


四、UE 和信令服务器不在同一台电脑
----------------------------------------------------------------------
  信令电脑: 双击 Start-SignallingServer.bat
  UE 电脑 : 编辑包里的 PixelStreaming.ini:
                [Signalling] Enabled=0
                [Game]       SignallingAddress=信令电脑窗口里显示的 IP, 例如 192.168.1.40
            然后双击 Start-PixelStreaming.bat, 它只启动 UE 并连到信令电脑。
  两台电脑都要运行一次 Open-Firewall.bat。

  不建议手动写 UE 启动参数: 脚本还会带上 -httpproxy="", 否则 UE 在设置了系统代理的
  电脑上连不上信令服务器(见常见问题 3)。


五、常见问题
----------------------------------------------------------------------
1. 窗口提示"端口已被占用"
   编辑 PixelStreaming.ini, 把 PlayerPort 改成 8080 之类, 访问地址随之变成
   http://IP:8080/ 。占用者显示为 System (PID 4) 时通常是 IIS 等系统 HTTP 服务。

2. 本机 http://127.0.0.1/ 能打开, 其他电脑打不开
   - 没运行 Open-Firewall.bat, 或运行时没选"以管理员身份运行";
   - 地址用错了: 要用窗口里显示的内网地址, 不能用 127.0.0.1(那是客户端自己);
   - 本机有多块网卡, 自动检测选错了: 在 PixelStreaming.ini 里填 HostAddress;
   - 单位网络不允许访问这台电脑的端口: 找网管放行 TCP PlayerPort(默认 80)。

3. 网页能打开, 但一直没有画面
   - 看信令窗口里有没有 "New streamer connection"(或访问 http://127.0.0.1/api/status 查看 streamer_count)。
     如果是 0, 说明 UE 没连上:
     确认任务管理器里有 <项目名>-Win64-Shipping.exe;
     确认 UE 是用 Start-PixelStreaming.bat 启动的 —— 电脑设置了系统代理(VPN/代理软件,
     或单位统一下发)时, UE 会把连信令服务器的请求发给代理而连不上, 脚本启动时带的
     -httpproxy="" 就是为了避开这一点;
   - UE 电脑的防火墙拦住了媒体流: 运行 Open-Firewall.bat;
   - 网络只放行 TCP、不放行 UDP(跨网段、严格防火墙常见):
     把 PixelStreaming.ini 的 [Turn] Mode 改成 local, 让网管放行本机 TCP 3478
     (以及 PlayerPort), 重新启动。还不行再把 ForceRelay 改成 1;
   - 用 Chrome 打开 chrome://webrtc-internals 能看到连接卡在哪一步。

4. 网页里有画面, 但 UE 里的按钮点不了
   - 要打开 http://IP/ 这个地址, 它会自动带上 HoveringMouse=true(悬停鼠标)再进入播放页。
     直接打开 player.html、或者用了旧收藏夹地址时, 在网页的设置(齿轮)里把
     "Control Scheme" 切成 "Hovering Mouse"。
   - Pad 上默认单指点按当作鼠标点击。程序需要多指手势时, 地址写成
     http://IP/?FakeMouseWithTouches=false 。

5. 网页画面卡住不动, 但声音 / 信令都正常
   UE 窗口被最小化了, 还原即可; 不需要本机显示时用 WindowMode=offscreen。

6. Pad 连着同一个 Wi-Fi 也打不开
   无线网常开着"AP 隔离 / 客户端隔离", 需要网管关闭, 或放行到这台电脑的访问。

7. 画面卡顿、延迟大
   检查无线信号; 本机屏幕分辨率很高(如 4K)时推流也是 4K, 可以把 WindowMode 改成
   windowed 并用 ResX / ResY 降低分辨率。

8. 需要远程协助或自动化巡检时
   - 双击 Check-PixelStreaming.bat, 把窗口截图, 连同 Logs 目录一起发给开发;
   - 或运行 node Offline\ps2-offline.js healthcheck 进行端到端健康检查。


六、开发机(能访问国内镜像或外网的电脑)
----------------------------------------------------------------------
  - 离线运行时(便携 Node、编译好的服务器、依赖、coturn)不在 Git 里, 由下面的脚本生成:
        Offline\Prepare-OfflineRuntime.bat -Mirror cn   国内镜像(npmmirror.com), 不开 VPN 即可生成
        Offline\Prepare-OfflineRuntime.bat              官方源
  - 部署到 UE 打包目录:
        Offline\Install-ToPackage.bat E:\pack\MyProject-Shipping\Windows
