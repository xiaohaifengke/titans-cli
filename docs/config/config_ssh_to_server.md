# 使用密钥认证机制远程登录Linux
在把nginx配置文件上传到服务器的时候需要使用公钥登录远程服务器，需要配置环境，操作步骤如下：
1. 在本机生成密钥对  
    使用ssh-keygen命令生成密钥对：  
    ```shell script
    ssh-keygen -t rsa   #-t表示类型选项，这里采用rsa加密算法
    ```
    
   然后根据提示一步步的按enter键即可（其中有一个提示是要求设置私钥口令passphrase，不设置则为空，这里看心情吧，如果不放心私钥的安全可以设置一下），
   执行结束以后执行`cat ~/.ssh/id_rsa.pub`获取到公钥。
2. 将公钥复制到远程主机中  
    使用ssh-copy-id命令将公钥复制到远程主机。ssh-copy-id会将公钥写到远程主机的 ~/.ssh/authorized_keys 文件中  
    ```
    ssh-copy-id root@192.168.0.18
    ```
   或者手动把公钥写入到服务器的 ~/.ssh/authorized_keys 文件中
   
经过以上两个步骤，以后再登录这个远程主机就不用再输入密码了。
