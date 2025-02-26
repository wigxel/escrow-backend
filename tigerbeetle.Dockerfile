# Use a minimal Debian image
FROM docker.io/library/debian:bookworm-slim

# Install necessary packages
RUN rm -rf /var/lib/apt/lists/* && \
    apt-get update && \
    apt-get install -y ca-certificates curl debian-archive-keyring unzip && \
    update-ca-certificates

# Set working directory to / so that the executable is on PATH
WORKDIR /

# Download and extract the TigerBeetle binary
RUN curl -Lo tigerbeetle.zip https://linux.tigerbeetle.com && \
    unzip tigerbeetle.zip && \
    rm tigerbeetle.zip && \
    chmod +x tigerbeetle

# (Optional) Expose a port if TigerBeetle listens on one (adjust as needed)
EXPOSE 3000

# Set TigerBeetle as the entrypoint so any container run executes it
CMD ["./tigerbeetle", "start", "--addresses=3000", "--development", "0_0.tigerbeetle"]
