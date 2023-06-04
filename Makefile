build:
	docker build -t buddy-bot .

run:
	docker run -d -p 3000:3000 --name buddy-bot --rm buddy-bot
	