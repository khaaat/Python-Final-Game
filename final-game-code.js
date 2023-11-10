cfa_final_game_code = `
########################### DO NOT EDIT ABOVE THIS LINE ###########################

################################ PYTHON CODE BELOW ################################

# STUDENTS:
#  - Type your own game code below
#  - Do not change any code outside of the designated area 



instruction = print_text("Instructions:", 50)
ball_instructions = print_text('''Hit the ball back and forth''', 35)
ball_instructions2 = print_text('''Ball speeds up with each hit''', 35)
ball_instructions3 = print_text('''Go until someone dies''', 35)
start_button = add_image("startbutton.png", 200)
place_element(start_button, 630, 400)
place_element(instruction, 575, 45)
place_element(ball_instructions, 509, 130)
place_element(ball_instructions2, 490, 175)
place_element(ball_instructions3, 540, 220)
add_background("greenbackground.jpg")
player_weapon = None
ball = None


def playerElements():
    global player_weapon
    global ball
    player_weapon = add_image("sword.png", 250)
    place_element(player_weapon, 100, 400)
    player_weapon2 = add_image("mirroredsword.png", 250)
    place_element(player_weapon2, 1125, 400)
    ball = add_image("redball.png", 350)
    place_element(ball, 550, 500)

def startGame(target):
    remove_el(target)
    remove_el(instruction)
    remove_el(ball_instructions)
    remove_el(ball_instructions2)
    remove_el(ball_instructions3)
    playerElements()
    ballAnimation()


click(start_button, startGame)



################################ PYTHON CODE ABOVE ################################

########################### DO NOT EDIT BELOW THIS LINE ###########################
`