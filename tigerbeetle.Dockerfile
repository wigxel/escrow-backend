# Use a minimal Alpine image
FROM alpine:3.21

# Install necessary packages (ca-certificates, curl, git, unzip, and zig)
RUN apk update && \
    apk add --no-cache ca-certificates curl git unzip zig && \
    update-ca-certificates

# Set working directory to / so that the executable is on PATH
WORKDIR /

# Clone the TigerBeetle repository
RUN git clone https://github.com/tigerbeetle/tigerbeetle.git

# Build the binary using Zig, move the executable to the root, and clean up
RUN cd tigerbeetle && \
    zig build -Dtarget=aarch64-linux

# (Optional) Expose port 3000 if TigerBeetle listens on that port
EXPOSE 3000

ENTRYPOINT ["./tigerbeetle/zig-out/bin/tigerbeetle"]
