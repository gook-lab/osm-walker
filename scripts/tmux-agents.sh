#!/bin/bash
# tmux 4분할 레이아웃으로 병렬 Claude 에이전트 실행

SESSION_NAME="claude-agents"
WORKDIR="$(pwd)"

# 기존 세션 있으면 종료
tmux kill-session -t $SESSION_NAME 2>/dev/null

# 새 세션 생성 (CLAUDECODE 해제하여 중첩 방지 우회)
tmux new-session -d -s $SESSION_NAME -c "$WORKDIR" -e "CLAUDECODE="

# 4분할 레이아웃 생성
tmux split-window -h -t $SESSION_NAME -c "$WORKDIR" -e "CLAUDECODE="
tmux split-window -v -t $SESSION_NAME:0.0 -c "$WORKDIR" -e "CLAUDECODE="
tmux split-window -v -t $SESSION_NAME:0.2 -c "$WORKDIR" -e "CLAUDECODE="

# 각 pane에서 claude 자동 실행 (선택사항 - 주석 해제하면 자동 실행)
# tmux send-keys -t $SESSION_NAME:0.0 'claude "Light 최적화"' Enter
# tmux send-keys -t $SESSION_NAME:0.1 'claude "Geometry 인스턴싱"' Enter
# tmux send-keys -t $SESSION_NAME:0.2 'claude "Material 풀링"' Enter
# tmux send-keys -t $SESSION_NAME:0.3 'claude "Particle 최적화"' Enter

# 세션 연결
tmux attach-session -t $SESSION_NAME

echo "
===================================
tmux 단축키:
  Ctrl+B, 방향키  = pane 이동
  Ctrl+B, z       = pane 최대화/복원
  Ctrl+B, d       = 세션 분리 (백그라운드)
  Ctrl+B, x       = 현재 pane 종료
===================================
"
