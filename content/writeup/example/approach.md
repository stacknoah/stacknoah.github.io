---
title: "Approach"
date: 2026-06-24
draft: true
ShowToc: true
---

## 고정 순서

0. 목표부터 — flag가 어디서, 어떤 조건이 충족돼야 나오나? (도착지를 모르면 공격 표면 전체를 헤맨다. 끝점을 찍어야 역산한다.)
1. 표면 맵핑 — 엔드포인트마다 메서드·입력(파라미터/헤더/바디)·출력·호출자(사용자?봇?서버?)는? (통제 가능한 입력의 전체 목록 = 무기고. 빠뜨린 입력 = 못 보는 공격로.)
2. 데이터 흐름 — 내 입력이 어디로 흘러 무엇에 닿나? 서버는 누구의 무엇을 신뢰하나? (취약점은 통제 가능한 입력이 신뢰받는 지점에 닿을 때 생긴다.)
3. 급소 + 가설 — 목표에 닿으려면 어느 신뢰를 깨야 하나? 깨질 후보를 나열하고 우선순위(가능성 × 목표 근접도). (후보를 다 적어야 한 우물만 파다 막히는 걸 막는다.)
4. 쪼개 검증 — 가장 유망한 가설을 최소 단위로 확인. (실패 지점을 좁히려고.)
5. 연결 — 단일로 목표 미달이면 조각을 어떻게 엮나? A의 출력이 B의 입력이 되나? (고난도 웹은 단일 취약점이 아니라 체인이다.)

## 라이트업 칸 매핑

1. 표면 맵핑
	@app.route('/create_note', methods=['POST'])
	def post_create_note():
	    content = request.form.get('content')
	    if not isinstance(content, str):
	        abort(400)
	    create_note(content)
	    return redirect(url_for('get_index'))
	-> 내용 타입 검증후 노트로 만들어서 반환

	@app.route('/update_note', methods=['POST'])
	def get_update_note():
	    note_id = request.form.get('note_id')
	    if not isinstance(note_id, str) or not note_id.isdigit():
	        abort(400)
	    note_id = int(note_id)
	    if note_id not in notes:
	        abort(404)
	    content = request.form.get('content')
	    if not isinstance(content, str):
	        abort(400)
	    update_note(note_id, content)
	    return redirect(url_for('get_index'))
	note_id 요청값으로 보내서 타입 검증 + 존재유무 검증 + content 타입 검증 -> 이 경우에는 입력값으로 노트 내용을 수정

	@app.route('/delete_note', methods=['POST'])
	def post_delete_note():
	    note_id = request.form.get('note_id')
	    if not isinstance(note_id, str) or not note_id.isdigit():
	        abort(400)
	    note_id = int(note_id)
	    if note_id not in notes:
	        abort(404)
	    delete_note(note_id)
	    return redirect(url_for('get_index'))
	note_id 타입 검증, 존재 유무 검증 -> 통과시 해당 노트 삭제 

	@app.route('/backup_notes', methods=['POST'])
	def post_backup_notes():
	    if len(notes) == 0:
	        abort(404)
	    backup_timestamp = request.cookies.get('backup-timestamp', f'{time.time()}')
	    if not isinstance(backup_timestamp, str):
	        abort(400)
	    backup_notes(backup_timestamp)
	    return redirect(url_for('get_index'))
	길이 0이거나 backup_timestamp str 아니면 동작 중단 정상 진행시 노트 백업해두기