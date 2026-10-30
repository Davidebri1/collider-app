# Collider Smart Gen v9.2.0 — validated2 empty-app E2E

Portrait 440×956, built web `/collider-app/`, empty `?fresh=1`. Captures: `artifacts/v920/e2e/`.

| ID | Flow | Result | Capture |
|----|------|--------|---------|
| EMPTY | Empty home, no Launch | PASS | 01_empty_home.png |
| SG-open | Apps → Smart Gen | PASS | 01c_boards_home.png |
| Trello#04 | Create Sprint | PASS | 02_board_sprint.png |
| Trello-menu | Board menu title | PASS | 07_board_menu.png |
| R13 | Search cards | PASS (visual + Semantics) | 08_search.png |
| R14 | Statistics Total/… | PASS | 09_statistics.png |
| R10-genie | MediaGen POST 200 + (4 changes) | PASS | 22_genie_after.png |
| R10-board | Close Genie → Alpha/Beta/Gamma | PASS | 22b_board_after_genie.png |
| SCAN-centring | Genie pane L12/R12 dense glass | PASS | 22_genie_after.png |

Fixes: centred CPane.phoneBoard + dense Genie; menu above overlays; Close Genie a11y; Close Genie clears editor; Search Semantics. Tests: 56 passed.
