import requests

ADDRESS = '192.168.3.31'

records_url = 'http://{}:5000/api/match_records'.format(ADDRESS)
file_url = 'http://{}:5000/api/match_record/{{filename}}'.format(ADDRESS)

current_filename = ''
event_count = 0

while True:
    #  获取最新文件
    response = requests.get(records_url, timeout=5)
    if response.status_code != 200:
        print('获取文件列表失败，请检查系统是否启动')
        continue
    record_list = response.json()['records']
    if not record_list:
        continue

    latest_record = record_list[0]
    filename = latest_record['filename']

    if filename != current_filename:
        print('\n', '=' * 40)
        print('当前文件:', filename)
        print('时间：', latest_record['match_date'])
        current_filename = filename
        event_count = 0            
        print('\n' + '=' * 40 +'\n')

    if latest_record['total_events'] <= event_count:
        continue

    # 获取文件
    file_response = requests.get(file_url.format(filename=filename), timeout=5)
    if file_response.status_code != 200:
        print('获取文件失败，请检查系统是否启动')
        continue

    events = file_response.json()['data']['events']
    
    for event in events[event_count:]:
        print("[{type}] {message}".format(
            type=event['type'],
            message=event['message']
        ))
        print("| {index:>5} | {time} \t| 经过 {elapsed_seconds}s \t| ID: {obj_id:<5} |".format(
            index=event['index'],
            time=event['time_str'],
            elapsed_seconds=event['elapsed_seconds'],
            obj_id=event['obj_id']
        ))
        for key, value in event['data'].items():
            print('{key}: {value}'.format(key=key, value=value))

        print('\n' + '=' * 40 +'\n')

    event_count = len(events)