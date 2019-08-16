## SSL Support
This feature allows you to access txAdmin through HTTPS, protecting you from some types of man-in-the-middle attacks.
This implementation is current in beta and only recommended for advanced users.  
When HTTPS is enabled, HTTP will still be available and won't redirect the users. If you want to guarantee that the admins will always use HTTPS, open only the HTTPS port in your firewall.
  
We recommend getting a SSL certificate from https://zerossl.com/ due to its simplicity.
It will work both with valid and self-signed certificated.  
We also recommend setting up a domain for txAdmin (well, all good FiveM servers should have one).
  
The SSL discussion: https://github.com/tabarra/txAdmin/issues/18  
  
### How to Enable
- Copy the private key to `data/key.pem`. The file should start with `-----BEGIN RSA PRIVATE KEY-----`
- Copy the certificate to `data/cert.pem`. The file should start with `-----BEGIN CERTIFICATE-----`
- Open the `config.json` file in your server profile folder (inside `data/`) and add the two fallowing values:
    - `webServer.enableHTTPS` and set it to `true`
    - `webServer.httpsPort` and set it to the desired port. If none is provided the default 50120 will be used.
- Restart txAdmin and access https://localhost:50120  
  
> **Note:** browsers will throw an error if you try to access the HTTPS port using `HTTP://` and vice versa.
