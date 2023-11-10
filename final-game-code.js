cfa_final_game_code = `
########################### DO NOT EDIT ABOVE THIS LINE ###########################

################################ PYTHON CODE BELOW ################################

# STUDENTS:
#  - Type your own game code below
#  - Do not change any code outside of the designated area 

def clearInstructions(target):
    remove_el(target)
    remove_el(instruction)
    remove_el(ball_instructions)
    remove_el(ball_instructions2)
    remove_el(ball_instructions3)


instruction = print_text("Instructions:", 50)
ball_instructions = print_text('''Hit the ball back and forth''', 35)
ball_instructions2 = print_text('''Ball speeds up with each hit''', 35)
ball_instructions3 = print_text('''Go until someone dies''', 35)
start_button = add_image("startbutton.png", 200)
place_element(start_button, 655, 400)
place_element(instruction, 610, 45)
place_element(ball_instructions, 535, 130)
place_element(ball_instructions2, 527, 175)
place_element(ball_instructions3, 565, 220)
add_background("greenbackground.jpg")
click(start_button, clearInstructions)





################################ PYTHON CODE ABOVE ################################

########################### DO NOT EDIT BELOW THIS LINE ###########################
`