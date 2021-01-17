# Loon
loon=$loon
rm $loon
echo "hostname = api.m.jd.com, wq.jd.com\n" >> $loon

for file in `ls | grep jd_ $1`
        do
            test=$(cat $file | grep 'cron.*script-path=.*tag=.*')
            test2=$(cat $file | grep 'http-request.*tag=.*script-path=.*')
            echo $test
              if [ -n "$test" ]; then
                var=$(cat $file | grep -oEi 'new Env(.*)')
                var=${var#*Env\(\'}
                var='# '${var%\'*}
                echo $var >> $loon
                if [ -n "$test2" ]; then
                  echo $test2 >> $loon
                fi
                echo $test"\n" >> $loon
            fi
        done
git add $loon
# Quantumultx
qx=./quantumultx/shylocks_gallery.json
rm $qx
echo "{" >> $qx
echo '  "name": "shylocks task gallery",' >> $qx
echo '  "description": "https://github.com/shylocks/Loon",' >> $qx
echo '  "task": [' >> $qx

for file in `ls | grep jd_ $1`
        do
            task=$(cat $file | grep 'tag=.*img-url=.*')
            echo $task
            if [ -n "$task" ]; then
              echo '    "'$task'",'>> $qx
            fi
        done
echo '  ]\n}' >> $qx
git add $qx
