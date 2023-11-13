cfa_final_game_code = `
########################### DO NOT EDIT ABOVE THIS LINE ###########################

################################ PYTHON CODE BELOW ################################

# STUDENTS:
#  - Type your own game code below
#  - Do not change any code outside of the designated area 

import random
table = None
cup = None
cup2 = None
cup3 = None
ball = None
reveal_button = None
seconds = 0
ready_button = None
scramble = None
black = None
guess_button = None

positions = [475, 675, 875]
randomPosition = random.randint(0, 2)
choose = positions[randomPosition]



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
add_background("ClosedCurtains.jpeg")



def startGame(target):
    global reveal_button
    remove_el(target)
    remove_el(instruction)
    remove_el(ball_instructions)
    remove_el(ball_instructions2)
    remove_el(ball_instructions3)
    playerElements()

    reveal_button = add_image("reveal.png", 300)
    place_element(reveal_button, 585, 200)

    ready_button = add_image("ready.png", 300)
    place_element(ready_button, 590, 50)
    
    click(reveal_button, showPlayer)
    click(ready_button, blackScreen)
    
    
    
    
    

def playerElements():
    global ball
    global table
    global cup
    global cup2
    global cup3

    add_background("Open.png")

    ball = add_image("ball.png", 125)
    place_element(ball, -3000, 420)

    table = add_image("Table.png", 900)
    place_element(table, 300, 525)

    cup = add_image("redcup.png", 375)
    place_element(cup, 350, 273)

    cup2 = add_image("redcup.png", 375)
    place_element(cup2, 550, 273)

    cup3 = add_image("redcup.png", 375)
    place_element(cup3, 750, 273)


# Showing the player the game

def showPlayer(target):
    global reveal_button
    remove_el(target)
    revealHint()
 
def revealHint():
    randomBallPlacement()
    if randomPosition == 0:
        reverseCupAnimation1()
    elif randomPosition == 1:
        reverseCupAnimation2()
    else:
        reverseCupAnimation3()

# Blinding the Player

def blackScreen(target):
    global black
    global scramble
    global guess_button
    remove_el(target)
    black = add_image("Black.jpeg", 2000)
    place_element(black, -1, -1)
    scramble = print_text("Scrambling!", 100)
    place_element(scramble, 465, 230)


# Reshowing the game



# Randomizing ball placement


def randomBallPlacement():
    global choose
    place_element(ball, choose, 420)


# Cup Animations


def reverseCupAnimation1():
    animate_y(cup, 25, 273, 1, False, 80)

def reverseCupAnimation2():
    animate_y(cup2, 25, 273, 1, False, 80)

def reverseCupAnimation3():
    animation_y(cup3, 25, 273, 1, False, 80)


click(start_button, startGame)




################################ PYTHON CODE ABOVE ################################

########################### DO NOT EDIT BELOW THIS LINE ###########################
`