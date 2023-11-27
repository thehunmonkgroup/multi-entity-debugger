# Example script to generate dummy messages for testing

####################################################
# Agent 1
####################################################

# No log_level
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"Performing cleanup","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'
# Debug
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"Everything looks OK","log_level":"DEBUG","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"Sensor reading normal","log_level":"DEBUG","another_key_1":"another_value_1","another_key_2":"another_value_2"}'

# Info
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"Completed checkpoint alpha","log_level":"INFO","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"Detected movement","log_level":"INFO","another_key_1":"another_value_1","another_key_2":"another_value_2"}'

# Warning
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"CPU usage high","log_level":"WARNING","another_key_1":"another_value_1","another_key_2":"another_value_2"}'
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"Temperature threshold exceeded","log_level":"WARNING","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'

# Error
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"Cannot reach database","log_level":"ERROR","another_key_1":"another_value_1","another_key_2":"another_value_2"}'
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"Sensor malfunction","log_level":"ERROR","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'

# Critical
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"System failure, shutting down","log_level":"CRITICAL","another_key_1":"another_value_1","another_key_2":"another_value_2"}'
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_1","label":"Agent 1","message":"Emergency pressure threshold exceeded","log_level":"CRITICAL","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'


####################################################
# Agent 1
####################################################

# No log_level
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"Restarting service","another_key_1":"another_value_1","another_key_2":"another_value_2"}'
# Debug
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"Everything looks OK","log_level":"DEBUG","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"Conditions normal","log_level":"DEBUG","another_key_1":"another_value_1","another_key_2":"another_value_2"}'

# Info
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"Completed checkpoint bravo","log_level":"INFO","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"Received new directives","log_level":"INFO","another_key_1":"another_value_1","another_key_2":"another_value_2"}'

# Warning
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"High resource utilization","log_level":"WARNING","another_key_1":"another_value_1","another_key_2":"another_value_2"}'
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"Cache size limit exceeded","log_level":"WARNING","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'

# Error
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"Cannot reach coordinator","log_level":"ERROR","another_key_1":"another_value_1","another_key_2":"another_value_2"}'
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"Subsystem failure","log_level":"ERROR","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'

# Critical
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"Initiating emergency procedures","log_level":"CRITICAL","another_key_1":"another_value_1","another_key_2":"another_value_2"}'
curl -X POST http://localhost:8000/send-message/ -H "Content-Type: application/json" -d '{"name":"agent_2","label":"Agent 2","message":"Unrecoverable error, shutting down","log_level":"CRITICAL","another_key_1":"another_value_1","another_key_2":{"key1":"value1","key2":2}}'
