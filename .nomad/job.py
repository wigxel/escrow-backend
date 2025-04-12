import os

# Load env vars from file
env_vars = {}
with open(".env", "r") as f:
    for line in f:
        line = line.strip()
        if line and "=" in line:
            key, value = line.split("=", 1)
            env_vars[key] = value.strip('"').strip("'")

# Generate HCL env lines, aligning the first variable
env_hcl_lines = []
first_variable = True
for k, v in env_vars.items():
    if first_variable:
        env_hcl_lines.append(f'{k} = "{v}"')  # No leading spaces for the first variable
        first_variable = False
    else:
        env_hcl_lines.append(f'        {k} = "{v}"')  # 8 leading spaces for the rest

env_hcl = "\n".join(env_hcl_lines)

# Load the template
with open("escrow_job_template.hcl", "r") as f:
    template = f.read()

# Inject env vars into the template
final_hcl = template.replace("{{ENV_VARS}}", env_hcl)

# Write final job spec to file
with open("generated_escrow.nomad.hcl", "w") as f:
    f.write(final_hcl)


# Run the job
os.system("nomad job run generated_escrow.nomad.hcl")
