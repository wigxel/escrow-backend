job "escrow-backend" {
  datacenters = ["dc1"]

  group "web" {
    count = 1

    network {
      port "http" {
        static = ${var.escrow_port}
        to = 8080
      }
    }

    task "escrow-backend" {
      driver = "docker"

      config {
        image = "${var.docker_repo}:${var.docker_tag}"
        auth {
            username = "${var.ghcr_username}"
            password = "${var.ghcr_token}"
        }
        privileged = true
        ports = ["http"]
      }

      env {
        {{ENV_VARS}}
      }
      resources {
        memory     = 512
        memory_max = 0
      }
    }
  }
}

variable "ghcr_username" {
  type = string
}

variable "ghcr_token" {
  type = string
}

variable "docker_tag" {
  type = string
}

variable "docker_repo" {
  type = string
}

variable "escrow_port" {
  type = string
}
