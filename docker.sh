docker build -t novqigarrix/employx_googleapis-service .
docker image rm novqigarrix/employx_googleapis-service

docker container create --name employx_googleapis-service -p 3003:3003 --network redisnetwork novqigarrix/employx_googleapis-service

docker container start employx_googleapis-service

docker container logs employx_googleapis-service -f

docker container ls