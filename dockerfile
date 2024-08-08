# Use the official Node.js image as a base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./


# Copy the rest of the application code
COPY . .

# Install dependencies
RUN npm install


# Compile TypeScript code

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "run","dev"]
