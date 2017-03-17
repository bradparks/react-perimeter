// @flow
import React, { Component } from 'react'

type Props = {
  onBreach: () => void,
  once: boolean,
  boundry: number,
  children: React$Element<*>
};

export default class Perimeter extends Component {
  props: Props;
  node: null | HTMLElement;
  bounds: null | ClientRect;
  breached: boolean;
  listening: boolean;
  constructor(props: Props) {
      super(props);
      // The HTML element used as the perimeter center
      this.node = null;
      // The result of calling getBoundingClientRect on this.node
      this.bounds = null;
      // Whether the mouse is within the perimeter
      this.breached = false;
      // If we're still listening for mousemove/resize events
      this.listening = false;
  }

  static propTypes = {
    onBreach: React.PropTypes.func.isRequired,
    once: React.PropTypes.bool,
    boundry: React.PropTypes.number.isRequired
  }

  /**
   * When the component mounts we calculate the ClientRect
   * for the target node and attach event listeners for:
   *   - `mousemove` for checking perimeter breaches
   *   - `resize` for recalculating ClientRect
   */
  componentDidMount() {
    const { handleMouseMove, handleResize, node } = this;
    if (node) {
      this.bounds = node.getBoundingClientRect();
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('resize', handleResize);
      this.listening = true;
    }
  }

  /**
   * Remove event listeners on unmount if we are still
   * listening.
   */
  componentWillUnmount() {
      if (this.listening) {
        this.removeEventListeners()
      }
  }

  /**
   * Removes the `mousemove` and `resize` listeners. May
   * be called on unmount, or after `onBreach` is called
   * if the `once` prop is set to `true`
   */
  removeEventListeners() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    this.listening = false;
  }

  /**
   * An element's position may change on resize, so we recalculate
   * the ClientRect for the node.
   * @todo debounce
   */
  handleResize = () => {
    if (this.node) {
      this.bounds = this.node.getBoundingClientRect();
    }
  }

  /**
   * Called on `mousemove`, using `clientX` and `clientY`
   * event properties to determine the position of the cursor.
   * The perimeter is then calculated from the ClientRect and the
   * `boundry` prop. If the mouse is within the perimeter,
   * and its not already breached (tracked on `this.breached`)
   * @param {MouseEvent} event mouse event
   */
  handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
    if (!this.bounds) return;
    const { boundry, onBreach, once } = this.props;
    const { top, right, bottom, left } = this.bounds;
    if (
        // Cursor is not too far left
        clientX > (left - boundry) &&
        // Cursor is not too far right
        clientX < (right + boundry) &&
        // Cursor is not too far up
        clientY > (top - boundry) &&
        // Cursor is not too far down
        clientY < (bottom + boundry)
    ) {
      if (this.breached) {
        return
      }
      onBreach()
      this.breached = true;
      if (once) {
        this.removeEventListeners()
      }
    } else {
      this.breached = false;
    }
  }

  /**
   * Ref callback used to populate this.node. If
   * a render callback is provided then it will be passed
   * to that callback with the expectation of it then
   * being passed to an element via the `ref` prop somewhere.
   * Otherwise the default `span` is rendered and populated.
   */
  attachRef = (node: HTMLElement) => {
    this.node = node
  }

  render() {
      const { children } = this.props;
      return typeof children === 'function'
        ? children(this.attachRef)
        : <span ref={this.attachRef}>{children}</span>
  }
}