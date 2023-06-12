# Security Guidelines

To enhance the security of your Pixel Streaming deployments, it is wise to implement additional measures for protection. This documentation page aims to provide you with valuable recommendations and suggestions to bolster the security of your deployments. By following these guidelines, you can significantly enhance the overall security posture and safeguard your Pixel Streaming environment effectively.

## Tips to Improve Security
Please note that implementing the following suggestions may introduce additional setup complexity and could result in increased latency.

1. **Isolate Unreal Engine Instance:** Avoid deploying the Unreal Engine instance on a cloud machine with a public IP. Instead, only allowlist the necessary servers, such as the signalling and TURN servers, to communicate with the UE instance.

2. **Route Media Traffic through TURN Server:** For enhanced security, enforce routing all media traffic through the TURN server. By doing so, only the TURN server and signalling server will be permitted to communicate with the UE instance. Keep in mind that this approach may introduce some additional latency.

3. **Secure TURN Server with User Credentials:** Configure the TURN server with a user database and assign unique credentials to each user. This additional security layer prevents unauthorized access to the relay. By default, Pixel Streaming employs the same TURN credentials for every session, which may simplify access for potential attackers.

4. **Avoid Storing Important Credentials in the UE Container:** As a precautionary measure, refrain from storing any critical credentials or sensitive information within the UE container. This practice helps maintain a higher level of security.

5. **Disable Pixel Streaming Console Commands:** Pixel Streaming ensures that all media traffic is encrypted end-to-end, guaranteeing secure communication. However, note that Pixel Streaming allows users to send commands to the UE instance if enabled. To eliminate this possibility, launch without the `-AllowPixelStreamingCommands` flag.

6. **Separate TURN and Signalling Servers:** It is recommended to avoid colocating the TURN and signalling servers with the UE instance on the same IP or virtual machine (VM). This enables you to configure separate ingress/egress security policies for each server, allowing flexibility in defining the desired level of strictness or looseness. For example, the TURN server can have more relaxed policies while the UE instance can have stricter ones.

By following these tips, you can enhance the security of your Pixel Streaming setup and mitigate potential risks.