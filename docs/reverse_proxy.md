# Implement reverse proxy for txAdmin
By default, txAdmin can remotely only be reached by using the server ip + the port.

- Firstly, this is not convenient to use and give others because you cannot remember it as easily as a full qualified domain name.

- Secondly, since the content is served over http, you are vulnerably against man in the middle attacks (which you can change with a FQDN and a SSL certificate).

By implementing a reverse proxy, we can accomplish both of these points.

This tutorial only covers the webserver software called NGINX, feel free to create a pull request with other webserver configurations like Apache or IIS. Keep
this in mind before using Apache against NGINX: https://serverguy.com/comparison/apache-vs-nginx/

## Setup
Requirements:
- Domain with access to create a new DNS record
- Webserver or webhosting with access to the configuration files
- SSL certificate to ensure https access (letsencrypt, https://zerossl.com/ or similiar services)

First you have to create a DNS record of type A with the desired subdomain (e.g. txadmin.yourdomain.net) pointing to the FiveM server
(the IP you use to get to the txAdmin panel). It should look something like this: ```txadmin.yourdomain.net   A   1.2.3.4```.

Then you have to make changes to the web server configuration, in this case, NGINX. Navigate to your NGINX configuration folder
(e.g. on Linux, this could be ```/etc/nginx/conf.d```) and create a new file called ```txadmin.conf```. In this file, insert
the following code:

```
server {
  server_name txadmin.yourdomain.net; # Change this to your domain as mentioned above
  client_max_body_size 50M;
	
  location / {
    proxy_pass http://1.2.3.4:40120/; # Change 1.2.3.4 to your ip that you defined in the DNS entry, leave port as it is
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host; # important for cfx.re logins
  }
  
  # this is about the ssl certificate, please look at the requirements for more information
  resolver 1.1.1.1 8.8.8.8;
  listen [::]:443 ssl http2;
  listen 443 ssl http2;
  ssl_stapling on;
  ssl_stapling_verify on;
  ssl_certificate /etc/letsencrypt/live/txadmin.yourdomain.net/fullchain.pem; # letsencrypt example on linux debian
  ssl_certificate_key /etc/letsencrypt/live/txadmin.yourdomain.net/privkey.pem; # letsencrypt example on linux debian
  ssl_trusted_certificate /etc/letsencrypt/live/txadmin.yourdomain.net/chain.pem; # letsencrypt example on linux debian
  include /etc/letsencrypt/options-ssl-nginx.conf; # letsencrypt example on linux debian
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # letsencrypt example on linux debian
}
```

You need to configure your ssl certificate yourself, please use an above mentioned provider for certificates. Certificates are required
to successfully use a https:// connection since that is how traffic is encrypted.

If you implemented the file and its content, you need to restart the webserver.
On Linux Debian this normally works as root in cmd with this command: ```systemctl restart nginx```

After you have done all this, enter ```https://txadmin.yourdomain.net``` in your web browser and it should all work out flawlessly.
You can check your certificates status in Chrome by clicking on the padlock. That is it, you are all done!
